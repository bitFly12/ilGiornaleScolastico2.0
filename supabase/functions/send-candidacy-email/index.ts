// Edge Function to send candidacy notification via Resend API
// Based on SUPABASE_EMAIL_SETUP.md implementation guide

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://yoursite.com'
const ADMIN_EMAIL = 'mohamed.mashaal@cesaris.edu.it'

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Sanitize UUID to prevent injection in URLs
function sanitizeUuid(uuid: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error('Invalid UUID format');
  }
  return uuid;
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
    const { candidatureId, email, fullName, motivation, studentClass, experience } = await req.json()

    // Validate required fields
    if (!candidatureId || !email || !fullName || !motivation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Sanitize UUID and escape HTML
    const sanitizedId = sanitizeUuid(candidatureId);
    const safeName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safeMotivation = escapeHtml(motivation);
    const safeClass = studentClass ? escapeHtml(studentClass) : '';
    const safeExperience = experience ? escapeHtml(experience) : '';

    // Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Giornale Cesaris <noreply@cesaris.edu.it>',
        to: [ADMIN_EMAIL],
        subject: `Nuova Candidatura Reporter: ${safeName}`,
        html: `
          <h2>Nuova Candidatura Reporter</h2>
          <p><strong>Nome:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          ${safeClass ? `<p><strong>Classe:</strong> ${safeClass}</p>` : ''}
          <p><strong>Motivazione:</strong></p>
          <p>${safeMotivation}</p>
          ${safeExperience ? `<p><strong>Esperienza:</strong></p><p>${safeExperience}</p>` : ''}
          
          <hr>
          
          <p>
            <a href="${SITE_URL}/admin.html?tab=candidatures&action=approve&id=${sanitizedId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin-right: 10px;">
              ✅ Approva
            </a>
            
            <a href="${SITE_URL}/admin.html?tab=candidatures&action=reject&id=${sanitizedId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px;">
              ❌ Rifiuta
            </a>
          </p>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            Oppure vai alla <a href="${SITE_URL}/admin.html">dashboard admin</a> per revisionare.
          </p>
        `
      })
    })

    const data = await res.json()
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 200
    })
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 400
    })
  }
})
