from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ClinicSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('name', models.CharField(default='Стоматологическая клиника', max_length=255, verbose_name='Название клиники')),
                ('address', models.TextField(blank=True, default='', verbose_name='Адрес')),
                ('phone', models.CharField(blank=True, default='', max_length=50, verbose_name='Телефон')),
                ('email', models.EmailField(blank=True, default='', verbose_name='Email')),
                ('working_hours', models.JSONField(default=dict, verbose_name='Рабочие часы')),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Настройки клиники',
                'verbose_name_plural': 'Настройки клиники',
            },
        ),
    ]
