from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0002_client_user_alter_client_date_of_birth_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='client',
            name='mobile_phone',
            field=models.CharField(blank=True, db_index=True, max_length=15, null=True, verbose_name='Телефон'),
        ),
        migrations.AlterField(
            model_name='client',
            name='iin',
            field=models.CharField(blank=True, db_index=True, max_length=12, null=True, verbose_name='ИИН'),
        ),
    ]
