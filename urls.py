from django.urls import path
from . import views

app_name = 'volunteers'

urlpatterns = [
    path('register/', views.volunteer_registration, name='register'),
    path('dashboard/', views.volunteer_dashboard, name='dashboard'),
    path('task/<int:task_id>/update/', views.volunteer_task_update, name='task-update'),
    path('group/create/', views.create_volunteer_group, name='create-group'),
]