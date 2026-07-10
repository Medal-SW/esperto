from app.config import settings
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_STARTTLS=settings.mail_starttls,
    MAIL_SSL_TLS=settings.mail_ssl_tls,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_password_reset_email(email_to: EmailStr, token: str) -> None:
    """
    Envia o e-mail real de recuperação de senha com link para o Front-end.
    """
    reset_link = f"{settings.frontend_url}/reset-password?token={token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
            Redefinir Senha
        </a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Se você não solicitou essa alteração, basta ignorar este e-mail. 
            O link expira em 30 minutos.
        </p>
    </div>
    """

    ref_id = token[:6]
    subject = f"[{ref_id}] Esperto | Recuperação de Senha"

    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        body=html_body,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)
