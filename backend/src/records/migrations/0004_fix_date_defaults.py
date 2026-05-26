import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('records', '0003_record_time_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='record',
            name='registration_date',
            field=models.DateField(default=datetime.date.today, verbose_name='Дата приема'),
        ),
        migrations.AlterField(
            model_name='record',
            name='reception_day',
            field=models.DateField(db_index=True, default=datetime.date.today),
        ),
    ]
