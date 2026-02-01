from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.db.models import Q
from django.contrib.auth import get_user_model
from apps.volunteers.models import Volunteer, VolunteerTask
from apps.messaging.models import IslamicMessagingGroup
from apps.volunteers.forms import VolunteerRegistrationForm
from apps.whatsapp.services import WhatsAppService

User = get_user_model()

class VolunteerListView(LoginRequiredMixin, ListView):
    model = Volunteer
    template_name = 'volunteers/list.html'
    context_object_name = 'volunteers'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Volunteer.objects.filter(status='active')
        search_query = self.request.GET.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(skills__icontains=search_query)
            )
        return queryset.select_related('user', 'assigned_group')

class VolunteerDetailView(LoginRequiredMixin, DetailView):
    model = Volunteer
    template_name = 'volunteers/detail.html'
    context_object_name = 'volunteer'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        volunteer = self.get_object()
        context['tasks'] = volunteer.tasks.all().order_by('-assigned_at')[:5]
        context['total_hours'] = volunteer.total_hours
        context['group'] = volunteer.assigned_group
        return context

@login_required
def volunteer_registration(request):
    if request.method == 'POST':
        form = VolunteerRegistrationForm(request.POST)
        if form.is_valid():
            volunteer = Volunteer.objects.create(
                user=request.user,
                volunteer_id=f"VOL-{request.user.id:05d}",
                skills=form.cleaned_data['skills'],
                experience=form.cleaned_data['experience'],
            )
            volunteer_group, created = IslamicMessagingGroup.objects.get_or_create(
                name="Volunteers",
                defaults={
                    'name_urdu': 'رضاکار',
                    'group_type': 'volunteer',
                    'creator': request.user,
                    'whatsapp_auto_add': True,
                }
            )
            volunteer_group.add_member(request.user)
            volunteer.assigned_group = volunteer_group
            volunteer.save()
            
            whatsapp_service = WhatsAppService()
            whatsapp_service.send_message_to_user(
                request.user,
                f"السلام علیکم! {request.user.first_name}\n\nخوش آمدید Muslim Revive Skills میں۔\nآپ کا Volunteer ID: {volunteer.volunteer_id}\n\nآپ کا WhatsApp گروپ:\n{volunteer_group.whatsapp_group_link}"
            )
            return redirect('volunteers:dashboard')
    else:
        form = VolunteerRegistrationForm()
    return render(request, 'volunteers/register.html', {'form': form})

@login_required
def volunteer_dashboard(request):
    try:
        volunteer = request.user.volunteer_profile
    except Volunteer.DoesNotExist:
        return redirect('volunteers:register')
    
    context = {
        'volunteer': volunteer,
        'tasks': volunteer.tasks.all().order_by('-assigned_at'),
        'group': volunteer.assigned_group,
        'total_hours': volunteer.total_hours,
        'tasks_completed': volunteer.total_tasks_completed,
    }
    return render(request, 'volunteers/dashboard.html', context)

@login_required
def volunteer_task_update(request, task_id):
    task = get_object_or_404(VolunteerTask, id=task_id)
    if task.volunteer.user != request.user:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'POST':
        status = request.POST.get('status')
        hours = request.POST.get('hours', 0)
        if status in ['pending', 'in_progress', 'completed', 'cancelled']:
            task.status = status
            task.actual_hours = int(hours)
            if status == 'completed':
                from django.utils import timezone
                task.completed_at = timezone.now()
                volunteer = task.volunteer
                volunteer.total_hours += int(hours)
                volunteer.total_tasks_completed += 1
                volunteer.save()
            task.save()
            return JsonResponse({'success': True})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
def create_volunteer_group(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'POST':
        group_name = request.POST.get('name')
        group_members_ids = request.POST.getlist('members')
        
        group = IslamicMessagingGroup.objects.create(
            name=group_name,
            group_type='volunteer',
            creator=request.user,
            whatsapp_auto_add=True,
        )
        
        members = User.objects.filter(id__in=group_members_ids)
        for member in members:
            group.add_member(member)
        
        whatsapp_service = WhatsAppService()
        result = whatsapp_service.create_group(group_name, list(members))
        
        if result:
            group.whatsapp_group_id = result['group_id']
            group.whatsapp_group_link = result['group_link']
            group.save()
            
            message = f"آپ کو {group_name} رضاکار گروپ میں شامل کیا گیا ہے۔\n\nگروپ لنک: {result['group_link']}"
            for member in members:
                whatsapp_service.send_message_to_user(member, message)
        
        return JsonResponse({
            'success': True,
            'group_id': group.id,
            'whatsapp_link': group.whatsapp_group_link
        })
    return render(request, 'volunteers/create_group.html')