# Hugging Face Spaces (SDK Docker): o serviço deve escutar na porta 7860.
FROM python:3.13-slim
RUN useradd -m -u 1000 user
WORKDIR /app
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=user bncc_verifica ./bncc_verifica
COPY --chown=user api ./api
USER user
EXPOSE 7860
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
