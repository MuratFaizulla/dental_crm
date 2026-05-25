from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('records', '0002_add_reception_day_index'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE records_record
                  ALTER COLUMN record_start TYPE time WITHOUT TIME ZONE USING NULL,
                  ALTER COLUMN record_end   TYPE time WITHOUT TIME ZONE USING NULL;
            """,
            reverse_sql="""
                ALTER TABLE records_record
                  ALTER COLUMN record_start TYPE date USING NULL,
                  ALTER COLUMN record_end   TYPE date USING NULL;
            """,
        ),
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
