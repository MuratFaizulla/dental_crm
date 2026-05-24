FROM python:3.11.5


SHELL ["/bin/bash", "-c"] 

WORKDIR /DENTAL_CRM

COPY backend/requirements.txt /DENTAL_CRM/backend/
RUN pip install -r /DENTAL_CRM/backend/requirements.txt

COPY . /DENTAL_CRM/