# Generated by Django 4.1.7 on 2023-06-02 04:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('spotify', '0002_votes'),
    ]

    operations = [
        migrations.AddField(
            model_name='votes',
            name='song_query',
            field=models.CharField(default='test', max_length=50),
            preserve_default=False,
        ),
    ]
