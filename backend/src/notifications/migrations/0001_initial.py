from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('records', '0003_record_time_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='SMSTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Название')),
                ('text', models.TextField(verbose_name='Текст шаблона')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'SMS-шаблон',
                'verbose_name_plural': 'SMS-шаблоны',
            },
        ),
        migrations.CreateModel(
            name='SMSLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(max_length=20, verbose_name='Телефон')),
                ('message', models.TextField(verbose_name='Сообщение')),
                ('sms_type', models.CharField(
                    choices=[('manual', 'Ручная'), ('remind_24h', 'За 24 часа'), ('remind_2h', 'За 2 часа')],
                    default='manual', max_length=20, verbose_name='Тип',
                )),
                ('status', models.CharField(
                    choices=[('pending', 'Ожидает'), ('sent', 'Отправлено'), ('delivered', 'Доставлено'), ('error', 'Ошибка')],
                    db_index=True, default='pending', max_length=20, verbose_name='Статус',
                )),
                ('provider_response', models.TextField(blank=True, default='', verbose_name='Ответ провайдера')),
                ('sent_at', models.DateTimeField(blank=True, null=True, verbose_name='Отправлено')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('record', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sms_logs',
                    to='records.record',
                )),
            ],
            options={
                'verbose_name': 'SMS-лог',
                'verbose_name_plural': 'SMS-логи',
                'ordering': ['-created_at'],
            },
        ),
    ]
