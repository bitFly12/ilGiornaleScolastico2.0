// Supabase Edge Function: Send Newsletter Confirmation Email
// This function sends a confirmation email when a user subscribes to the newsletter
// Using Resend API for email delivery

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    const { email } = await req.json()
    
    if (!email) {
      throw new Error('Email is required')
    }

    // Get Resend API key from environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Giornale Cesaris <newsletter@cesaris.edu.it>',
        to: [email],
        subject: '✅ Iscrizione alla Newsletter - Giornale Cesaris',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0033A0, #004080); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #0033A0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📰 Giornale Cesaris</h1>
                <p>Iscrizione Confermata!</p>
              </div>
              <div class="content">
                <h2>Benvenuto nella nostra community!</h2>
                <p>Grazie per esserti iscritto alla newsletter del Giornale Scolastico Cesaris.</p>
                <p>Riceverai aggiornamenti su:</p>
                <ul>
                  <li>📝 Nuovi articoli pubblicati</li>
                  <li>🎓 Eventi scolastici</li>
                  <li>📚 Contenuti esclusivi</li>
                  <li>🌟 Novità dal mondo della scuola</li>
                </ul>
                <p>Puoi visitare il nostro sito in qualsiasi momento:</p>
                <a href="https://your-domain.com" class="button">Visita il Giornale</a>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  Se non hai richiesto questa iscrizione, puoi ignorare questa email.
                </p>
              </div>
              <div class="footer">
                <p>&copy; 2024 Giornale Scolastico Cesaris. Tutti i diritti riservati.</p>
                <p>Per cancellarti dalla newsletter, contattaci.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Confirmation email sent successfully',
        id: result.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
