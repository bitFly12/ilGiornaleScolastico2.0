// Supabase Edge Function to send candidacy notification emails
// Uses Resend API for email delivery

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CandidacyRequest {
  candidatureId: string
  email: string
  fullName: string
  studentClass: string
  motivation: string
  experience: string
  toEmail: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const {
      candidatureId,
      email,
      fullName,
      studentClass,
      motivation,
      experience,
      toEmail
    }: CandidacyRequest = await req.json()

    // Validate required fields
    if (!candidatureId || !email || !fullName || !motivation || !toEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Giornale Cesaris <noreply@giornalecesaris.it>',
        to: [toEmail],
        subject: `📝 Nuova Candidatura Reporter: ${fullName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #0033A0, #00f0ff);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .field {
                margin: 20px 0;
                padding: 15px;
                background: white;
                border-left: 4px solid #0033A0;
                border-radius: 4px;
              }
              .field-label {
                font-weight: 600;
                color: #0033A0;
                margin-bottom: 8px;
              }
              .field-value {
                color: #4b5563;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background: #0033A0;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">📰 Nuova Candidatura Reporter</h1>
            </div>
            <div class="content">
              <p>Ciao! È stata ricevuta una nuova candidatura per diventare reporter del Giornale Cesaris.</p>
              
              <div class="field">
                <div class="field-label">👤 Nome Completo</div>
                <div class="field-value">${fullName}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📧 Email</div>
                <div class="field-value">${email}</div>
              </div>
              
              <div class="field">
                <div class="field-label">🎓 Classe</div>
                <div class="field-value">${studentClass}</div>
              </div>
              
              <div class="field">
                <div class="field-label">💭 Motivazione</div>
                <div class="field-value">${motivation}</div>
              </div>
              
              ${experience ? `
              <div class="field">
                <div class="field-label">📝 Esperienza</div>
                <div class="field-value">${experience}</div>
              </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="${SUPABASE_URL.replace('/rest/v1', '')}/admin.html?tab=candidatures&action=review&id=${candidatureId}" class="button">
                  👁️ Visualizza e Revisiona Candidatura
                </a>
              </div>
              
              <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <strong>⏰ Azione Richiesta:</strong><br>
                Questa candidatura richiede una revisione entro 7 giorni. Accedi al pannello admin per approvare o rifiutare.
              </p>
            </div>
            <div class="footer">
              <p>Giornale Scolastico Cesaris • Istituto Cesaris<br>
              Questa email è stata generata automaticamente. Non rispondere a questo messaggio.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Nuova Candidatura Reporter - Giornale Cesaris

Nome: ${fullName}
Email: ${email}
Classe: ${studentClass}

Motivazione:
${motivation}

${experience ? `Esperienza:\n${experience}\n\n` : ''}

Visualizza la candidatura completa nel pannello admin:
${SUPABASE_URL.replace('/rest/v1', '')}/admin.html?tab=candidatures&action=review&id=${candidatureId}

Azione richiesta entro 7 giorni.
        `
      })
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${error}`)
    }

    const data = await res.json()
    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in send-candidacy-email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
