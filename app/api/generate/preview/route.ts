import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Theme → GPT tone guidance
const THEME_GUIDANCE: Record<string, string> = {
  life: '日常生活中的小故事，有溫度的敘事，讓人會心一笑或感動。',
  knowledge: '冷知識、趣味事實，用輕鬆易懂的方式傳達資訊。',
  marketing: '產品介紹或促銷短片，強調賣點與行動呼籲。',
  comedy: '搞笑反差梗、無厘頭劇情，結尾要有笑點。',
  inspiring: '情感勵志、人生感悟，溫暖正能量收尾。',
  thriller: '驚悚懸疑、都市傳說風格，第 5 段要有反轉或細思極恐。',
  kids: '童話故事口吻，簡單詞彙，溫馨結局。',
}

// Style → visual prompt modifier (used later by FLUX/Kling via n8n)
const STYLE_DESCRIPTOR: Record<string, string> = {
  cinematic: 'cinematic realistic photography, film grain, shallow depth of field, dramatic lighting',
  anime: 'Japanese anime style, cel shading, vibrant colors, Studio Ghibli inspired',
  '3d_cartoon': '3D Pixar-style cartoon, smooth shading, playful colors',
  watercolor: 'soft watercolor illustration, hand-painted, pastel tones',
  cyberpunk: 'cyberpunk neon aesthetic, futuristic city, holographic lights, dark atmosphere',
  vintage_film: 'vintage 1970s film photography, warm grain, faded colors',
  minimal_line: 'minimal line art illustration, clean vectors, limited palette',
  fantasy: 'dreamy fantasy illustration, magical atmosphere, ethereal lighting',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, theme = 'life', style = 'cinematic' } = body

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: '請輸入主題' }, { status: 400 })
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未登入' }, { status: 401 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: 'Server misconfiguration: OPENAI_API_KEY not set' }, { status: 500 })
    }

    const themeGuide = THEME_GUIDANCE[theme] || THEME_GUIDANCE.life
    const styleDesc = STYLE_DESCRIPTOR[style] || STYLE_DESCRIPTOR.cinematic

    const systemPrompt = `You are a short video script writer + AI image prompt expert.

CRITICAL RULES (violations will cause system failure):
1. You MUST write about the EXACT topic provided by the user. Do NOT invent a different topic.
2. LANGUAGE RULES (ABSOLUTE):
   - All Chinese output MUST be 繁體中文 (Traditional Chinese, zh-TW).
   - 禁止使用任何簡體字 (NO Simplified Chinese characters anywhere).
   - If user topic is in any non-Chinese language, STILL output Chinese fields in 繁體中文.
3. 'narration' is 150-180 繁中 characters total.
4. EXACTLY 5 scenes, scene 1 has a hook, scene 5 has a twist or memorable ending.
5. Output ONLY valid JSON (no markdown wrap, no prose before/after).
6. For every scene, fill ALL structured fields:
   - story_beat: ONE 繁中 sentence describing that scene's dramatic purpose (e.g., "主角登場，建立同情點")
   - narration_zh_tw: that scene's 繁中 narration chunk (~30 chars, a slice of the full narration)
   - camera: English cinematography directive — shot size + angle + movement (e.g., "extreme close-up, low angle, slow dolly-in")
   - objects: array of EVERY visible subject (characters, animals, key props). Each object has:
       name (繁中 short label)
       appearance (繁中 detailed: color/texture/size/age/clothing)
       sound (繁中 — sound it makes this scene, or '無' if silent)
       action (繁中 — specific motion in this scene)
   - visual_zh: 繁中 畫面簡述 (for UI preview display)
   - visual_prompt: DETAILED English text-to-image prompt for FLUX that EXPLICITLY merges: the camera directive, every object's appearance + action, environment, atmosphere. Append this style descriptor at the end: "${styleDesc}"

Theme guidance: ${themeGuide}

Output JSON schema:
{
  "title": "繁中標題(10字內)",
  "hook": "前3秒鉤子(20字內, 繁中)",
  "narration": "完整旁白純文字(150-180 繁中字)",
  "mood": "upbeat|calm|cinematic|dramatic|playful",
  "scenes": [
    {
      "scene": 1,
      "story_beat": "繁中一句劇情功能",
      "narration_zh_tw": "這幕對應旁白 (繁中)",
      "camera": "English camera directive",
      "objects": [
        { "name": "繁中", "appearance": "繁中細節", "sound": "繁中或'無'", "action": "繁中" }
      ],
      "visual_zh": "繁中畫面描述",
      "visual_prompt": "English prompt ending with style descriptor"
    }
    // ... 5 scenes total
  ]
}`

    const userPrompt = `主題：「${topic.trim()}」\n\n請嚴格根據以上主題產出腳本。`

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('OpenAI error:', r.status, errText)
      return NextResponse.json({ error: 'GPT 產生劇本失敗' }, { status: 502 })
    }

    const data = await r.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'GPT 回應格式異常' }, { status: 502 })
    }

    let script
    try {
      script = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'GPT 產出的 JSON 無法解析' }, { status: 502 })
    }

    // Validate script shape
    if (!script.scenes || !Array.isArray(script.scenes) || script.scenes.length !== 5) {
      return NextResponse.json({ error: 'GPT 產出的分鏡數不對（需要 5 段）' }, { status: 502 })
    }

    return NextResponse.json({ success: true, script })
  } catch (error) {
    console.error('Error in /api/generate/preview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
