from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class Volunteer(models.Model):
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('inactive', _('Inactive')),
        ('suspended', _('Suspended')),
        ('retired', _('Retired')),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    volunteer_id = models.CharField(max_length=50, unique=True, help_text="Unique volunteer ID")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    skills = models.TextField(blank=True, help_text="Volunteer skills (comma-separated)")
    experience = models.TextField(blank=True, help_text="Volunteer experience")
    
    volunteer_since = models.DateTimeField(auto_now_add=True)
    
    total_hours = models.IntegerField(default=0)
    total_tasks_completed = models.IntegerField(default=0)
    
    assigned_group = models.ForeignKey(
        'messaging.IslamicMessagingGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='volunteers'
    )
    
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_volunteers')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    whatsapp_added_to_group = models.BooleanField(default=False)
    whatsapp_added_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-volunteer_since']
    
    def __str__(self):
        return f"Volunteer: {self.user.get_full_name()}"

class VolunteerTask(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]
    
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    priority = models.IntegerField(choices=[(1, _('Low')), (2, _('Medium')), (3, _('High'))], default=2)
    
    estimated_hours = models.IntegerField(default=1)
    actual_hours = models.IntegerField(default=0)
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.title} - {self.volunteer.user.username}"