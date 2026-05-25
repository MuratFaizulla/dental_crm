from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('records', '0002_add_reception_day_index'),
    ]

    operations = [
        migrations.AlterField(
            model_name='record',
            name='record_start',
            field=models.TimeField(blank=True, null=True, verbose_name='Время начала'),
        ),
        migrations.AlterField(
            model_name='record',
            name='record_end',
            field=models.TimeField(blank=True, null=True, verbose_name='Время окончания'),
        ),
    ]
