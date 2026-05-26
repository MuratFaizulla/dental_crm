from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import UserManager

LANGUAGE_CHOICES = [('kk', 'Қазақша'), ('ru', 'Русский'), ('en', 'English')]


class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_DOCTOR = 'doctor'
    ROLE_PATIENT = 'patient'
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Администратор'),
        (ROLE_DOCTOR, 'Врач'),
        (ROLE_PATIENT, 'Пациент'),
    ]

    username      = models.CharField('Логин', max_length=150, unique=True)
    email         = models.EmailField('Email', unique=True, null=True, blank=True)
    first_name    = models.CharField('Аты', max_length=255, blank=True, default='')
    last_name     = models.CharField('Тегі', max_length=255, blank=True, default='')
    father_name   = models.CharField('Әкесінің аты', max_length=255, blank=True, default='')
    iin           = models.CharField('ЖСН', max_length=12, unique=True, null=True, blank=True)
    date_of_birth = models.DateField('Туған күні', null=True, blank=True)
    mobile_phone  = models.CharField('Мобильді телефон', max_length=15, null=True, blank=True)
    oblast        = models.CharField('Облыс', max_length=255, blank=True, default='')
    address       = models.TextField('Мекенжай', blank=True, default='')
    language      = models.CharField('Тіл', max_length=5, choices=LANGUAGE_CHOICES, default='ru')
    avatar        = models.ImageField('Аватар', upload_to='avatars/', null=True, blank=True)
    gender        = models.CharField('Жынысы', max_length=1,
                       choices=[('M', 'Ер'), ('F', 'Әйел')], blank=True, default='')
    role          = models.CharField('Роль', max_length=20, choices=ROLE_CHOICES, default=ROLE_ADMIN)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True, null=True)
    updated_at    = models.DateTimeField(auto_now=True, null=True)

    groups = models.ManyToManyField(
        'auth.Group', related_name='custom_user_groups', blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', related_name='custom_user_permissions', blank=True,
    )

    objects = UserManager()
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'UserAccount'
        ordering = ['-created_at']
        verbose_name = 'Пайдаланушы'
        verbose_name_plural = 'Пайдаланушылар'

    def __str__(self):
        return f'{self.id} - {self.username}'


RELATION_CHOICES = [
    ('mother',          'Ана'),
    ('father',          'Әке'),
    ('son',             'Ұлы'),
    ('daughter',        'Қызы'),
    ('adoptive_parent', 'Асырап алушы'),
    ('grandparent',     'Ата ана'),
    ('adopted_child',   'Асырап алынған бала'),
]


class FamilyMember(models.Model):
    user          = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='family_members'
    )
    relation_type = models.CharField('Туыстық', max_length=20, choices=RELATION_CHOICES)
    iin           = models.CharField('ЖСН', max_length=12, blank=True, default='')
    last_name     = models.CharField('Тегі', max_length=255, blank=True, default='')
    first_name    = models.CharField('Аты', max_length=255)
    father_name   = models.CharField('Әкесінің аты', max_length=255, blank=True, default='')
    date_of_birth = models.DateField('Туған күні', null=True, blank=True)
    gender        = models.CharField('Жынысы', max_length=1,
                       choices=[('M', 'Ер'), ('F', 'Әйел')], blank=True, default='')
    address       = models.TextField('Мекенжай', blank=True, default='')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'FamilyMember'
        ordering = ['first_name']
        verbose_name = 'Отбасы мүшесі'
        verbose_name_plural = 'Отбасы мүшелері'

    def __str__(self) -> str:
        return f'{self.first_name} {self.last_name} ({self.get_relation_type_display()})'
