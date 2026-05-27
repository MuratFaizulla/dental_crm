from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical', '0002_add_timestamps'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicalnote',
            name='odontogram_json',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
