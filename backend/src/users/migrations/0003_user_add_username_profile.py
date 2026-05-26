from django.db import migrations, models


def populate_usernames(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        base = user.email.split('@')[0] if user.email else f'user{user.pk}'
        candidate = base
        i = 1
        while User.objects.filter(username=candidate).exists():
            candidate = f'{base}{i}'
            i += 1
        user.username = candidate
        user.save(update_fields=['username'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_options_user_role_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True, verbose_name='Email'),
        ),
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(blank=True, max_length=150, null=True, verbose_name='Логин'),
        ),
        migrations.AddField(
            model_name='user',
            name='father_name',
            field=models.CharField(blank=True, default='', max_length=255, verbose_name='Әкесінің аты'),
        ),
        migrations.AddField(
            model_name='user',
            name='iin',
            field=models.CharField(blank=True, max_length=12, null=True, unique=True, verbose_name='ЖСН'),
        ),
        migrations.AddField(
            model_name='user',
            name='oblast',
            field=models.CharField(blank=True, default='', max_length=255, verbose_name='Облыс'),
        ),
        migrations.AddField(
            model_name='user',
            name='address',
            field=models.TextField(blank=True, default='', verbose_name='Мекенжай'),
        ),
        migrations.AddField(
            model_name='user',
            name='language',
            field=models.CharField(
                choices=[('kk', 'Қазақша'), ('ru', 'Русский'), ('en', 'English')],
                default='ru', max_length=5, verbose_name='Тіл',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='avatars/', verbose_name='Аватар'),
        ),
        migrations.RunPython(populate_usernames, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='username',
            field=models.CharField(max_length=150, unique=True, verbose_name='Логин'),
        ),
    ]
