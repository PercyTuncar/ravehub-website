// Utility functions for Search Console monitoring and verification

export interface SearchConsoleMetrics {
  url: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  lastCrawled?: Date
  indexStatus?: 'indexed' | 'not_indexed' | 'unknown'
}

/**
 * Verifica si una URL está indexada en Google
 * Nota: Esta es una función de utilidad para monitoreo manual
 * En producción, usarías la Search Console API
 */
export async function checkUrlIndexStatus(url: string): Promise<'indexed' | 'not_indexed' | 'unknown'> {
  try {
    // Simulación de verificación - en producción usar Search Console API
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(new URL(url).origin)}/searchAnalytics/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_SEARCH_CONSOLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['page'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'equals',
            expression: url
          }]
        }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.rows && data.rows.length > 0 ? 'indexed' : 'not_indexed'
    }

    return 'unknown'
  } catch (error) {
    console.error('Error checking index status:', error)
    return 'unknown'
  }
}

/**
 * Obtiene métricas de rendimiento para una consulta específica
 */
export async function getQueryPerformance(query: string, siteUrl: string): Promise<SearchConsoleMetrics | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_SEARCH_CONSOLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query', 'page'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            operator: 'equals',
            expression: query
          }]
        }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.rows && data.rows.length > 0) {
        const row = data.rows[0]
        return {
          url: row.keys[1], // page URL
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting query performance:', error)
    return null
  }
}

/**
 * Verifica la presencia de rich results para una URL
 */
export async function checkRichResults(url: string): Promise<{
  hasEventRichResult: boolean
  hasOrganizationRichResult: boolean
  errors: string[]
}> {
  try {
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(new URL(url).origin)}/urlInspection/index:inspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_SEARCH_CONSOLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: new URL(url).origin
      })
    })

    const result = {
      hasEventRichResult: false,
      hasOrganizationRichResult: false,
      errors: [] as string[]
    }

    if (response.ok) {
      const data = await response.json()
      const richResults = data.inspectionResult?.richResultsResult?.detectedItems || []

      richResults.forEach((item: any) => {
        if (item.richResultType === 'event') {
          result.hasEventRichResult = true
        }
        if (item.richResultType === 'organization') {
          result.hasOrganizationRichResult = true
        }

        if (item.issues && item.issues.length > 0) {
          item.issues.forEach((issue: any) => {
            result.errors.push(`${item.richResultType}: ${issue.severity} - ${issue.issueMessage}`)
          })
        }
      })
    }

    return result
  } catch (error) {
    console.error('Error checking rich results:', error)
    return {
      hasEventRichResult: false,
      hasOrganizationRichResult: false,
      errors: ['Error checking rich results']
    }
  }
}

/**
 * Función de monitoreo principal para verificar estado SEO de eventos importantes
 */
export async function monitorEventSEO(eventSlug: string, eventName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ravehublatam.com'
  const eventUrl = `${baseUrl}/eventos/${eventSlug}`

  console.log(`🔍 Monitoring SEO for event: ${eventName}`)
  console.log(`📍 URL: ${eventUrl}`)

  // Verificar indexación
  const indexStatus = await checkUrlIndexStatus(eventUrl)
  console.log(`📊 Index Status: ${indexStatus}`)

  // Verificar rich results
  const richResults = await checkRichResults(eventUrl)
  console.log(`🎭 Event Rich Result: ${richResults.hasEventRichResult ? '✅' : '❌'}`)
  console.log(`🏢 Organization Rich Result: ${richResults.hasOrganizationRichResult ? '✅' : '❌'}`)

  if (richResults.errors.length > 0) {
    console.log('⚠️  Rich Result Errors:')
    richResults.errors.forEach(error => console.log(`   - ${error}`))
  }

  // Verificar rendimiento de búsqueda para consultas relacionadas
  const queries = [
    `${eventName.toLowerCase()}`,
    `${eventName.toLowerCase()} lima`,
    `${eventName.toLowerCase()} 2025`,
    `${eventName.toLowerCase()} entradas`
  ]

  for (const query of queries) {
    const performance = await getQueryPerformance(query, baseUrl)
    if (performance) {
      console.log(`🔍 Query "${query}": ${performance.impressions} imp, ${performance.clicks} clicks, pos ${performance.position.toFixed(1)}`)
    } else {
      console.log(`🔍 Query "${query}": No data available`)
    }
  }

  return {
    eventUrl,
    indexStatus,
    richResults,
    monitoredAt: new Date()
  }
}