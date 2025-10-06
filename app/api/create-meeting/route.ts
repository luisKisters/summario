import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types for the API request and response
interface CreateMeetingRequest {
  meeting_name: string;
  meeting_url: string;
  agenda_topics: Array<{ topic: string; details?: string }>;
  start_time_option: "now" | "scheduled";
  scheduled_start_datetime?: string; // ISO 8601 format
  enable_diarization?: boolean;
  language?: string;
  send_initial_message?: boolean;
}

// Helper function to determine service from meeting URL
function determineService(meetingUrl: string): "gmeet" | "teams" | "zoom" {
  const url = meetingUrl.toLowerCase();
  if (url.includes("meet.google.com") || url.includes("gmeet")) {
    return "gmeet";
  } else if (url.includes("teams.microsoft.com") || url.includes("teams")) {
    return "teams";
  } else if (url.includes("zoom.us") || url.includes("zoom")) {
    return "zoom";
  }
  throw new Error(
    `Unable to determine meeting service from URL: ${meetingUrl}`
  );
}

// Helper function to convert ISO datetime to Unix timestamp
function convertISOtoUnix(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}

// Helper function to get introductory chat message in different languages
function getIntroductoryMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "Summario is transcribing and generating minutes for this meeting. If you do not consent, please state your objection now.",
    es: "Summario está transcribiendo y generando actas para esta reunión. Si no consiente, por favor indique su objeción ahora.",
    fr: "Summario transcrit et génère des procès-verbaux pour cette réunion. Si vous ne consentez pas, veuillez indiquer votre objection maintenant.",
    de: "Summario transkribiert und erstellt Protokolle für dieses Meeting. Wenn Sie nicht einverstanden sind, teilen Sie bitte jetzt Ihren Einwand mit.",
    it: "Summario sta trascrivendo e generando verbali per questo incontro. Se non acconsenti, per favore esprimi la tua obiezione ora.",
    pt: "O Summario está transcrevendo e gerando atas para esta reunião. Se você não consente, por favor declare sua objeção agora.",
    ja: "Summarioがこの会議の文字起こしと議事録作成を行っています。同意されない場合は、今すぐ異議を述べてください。",
    ko: "Summario가 이 회의를 전사하고 회의록을 생성하고 있습니다. 동의하지 않으시면 지금 이의를 제기해 주세요.",
    zh: "Summario正在转录并生成此次会议的会议纪要。如果您不同意，请现在提出异议。",
    ru: "Summario транскрибирует и создает протокол этого собрания. Если вы не согласны, пожалуйста, выразите свое возражение сейчас.",
    hi: "Summario इस बैठक के लिए ट्रांसक्रिप्शन और मिनट्स तैयार कर रहा है। यदि आप सहमत नहीं हैं, तो कृपया अभी अपनी आपत्ति बताएं।",
    nl: "Summario transcribeert en genereert notulen voor deze vergadering. Als u niet instemt, gelieve uw bezwaar nu kenbaar te maken.",
    tr: "Summario bu toplantı için transkripsiyon yapıyor ve tutanak oluşturuyor. Rıza göstermiyorsanız, lütfen itirazınızı şimdi belirtin.",
    no: "Summario transkriberer og genererer referater for dette møtet. Hvis du ikke samtykker, vennligst gi uttrykk for din innvending nå.",
    id: "Summario sedang mentranskrip dan membuat notulen untuk rapat ini. Jika Anda tidak setuju, silakan nyatakan keberatan Anda sekarang.",
    sv: "Summario transkriberar och genererar protokoll för detta möte. Om du inte samtycker, vänligen uttryck din invändning nu.",
    da: "Summario transkriberer og genererer referater til dette møde. Hvis du ikke giver dit samtykke, bedes du angive din indsigelse nu.",
    pl: "Summario transkrybuje i generuje protokoły z tego spotkania. Jeśli nie wyrażasz zgody, prosimy o zgłoszenie sprzeciwu teraz.",
    vi: "Summario đang phiên âm và tạo biên bản cho cuộc họp này. Nếu bạn không đồng ý, vui lòng nêu ý kiến phản đối ngay bây giờ.",
    ar: "يقوم Summario بنسخ وإنشاء محاضر لهذا الاجتماع. إذا كنت لا توافق، يرجى ذكر اعتراضك الآن.",
    th: "Summario กำลังถอดเสียงและสร้างรายงานการประชุมนี้ หากคุณไม่ยินยอม กรุณาแจ้งคัดค้านตอนนี้",
    fi: "Summario litteroi ja luo pöytäkirjaa tästä kokouksesta. Jos et anna suostumustasi, ilmoita vastalauseesi nyt.",
    cs: "Summario přepisuje a generuje zápis z této schůzky. Pokud nesouhlasíte, vyjádřete prosím svou námitku nyní.",
    hu: "A Summario átírja és jegyzőkönyvet készít erről az értekezletről. Ha nem ért egyet, kérjük, most fejezze ki kifogását.",
    bg: "Summario транскрибира и генерира протокол от тази среща. Ако не се съгласявате, моля изразете възражението си сега.",
    hr: "Summario transkribira i generira zapisnik ovog sastanka. Ako se ne slažete, molimo izrazite svoj prigovor sada.",
    sk: "Summario prepisuje a generuje zápisnicu z tejto schôdze. Ak nesúhlasíte, vyjadrite prosím svoj námietku teraz.",
    sl: "Summario prepisuje in ustvarja zapisnik tega sestanka. Če se ne strinjate, prosimo izrazite svoj ugovor zdaj.",
    et: "Summario transkribeerib ja loob selle koosoleku protokolli. Kui te ei nõustu, palun avaldage oma vastuväide kohe.",
    lv: "Summario transkribē un veido šīs sapulces protokolu. Ja jūs nepiekrītat, lūdzu, izteiciet savu iebildumu tagad.",
    lt: "Summario transkribuoja ir kuria šio susitikimo protokolą. Jei nesutinkate, prašome dabar pareikšti savo prieštaravimą.",
    ro: "Summario transcrie și generează procesul-verbal al acestei întâlniri. Dacă nu sunteți de acord, vă rugăm să vă exprimați obiecția acum.",
    uk: "Summario транскрибує та генерує протокол цієї зустрічі. Якщо ви не згодні, будь ласка, висловіть свою заперечення зараз.",
    af: "Summario transkribeer en genereer notules vir hierdie vergadering. As jy nie toestem nie, stel asseblief jou beswaar nou bekend.",
    hy: "Summario գրանցում և արձանագրություններ է ստեղծում այս հանդիպման համար: Եթե դուք համաձայն չեք, խնդրում ենք հիմա հայտնել ձեր առարկությունը:",
    az: "Summario bu görüş üçün transkripsiyanı və protokolları hazırlayır. Əgər razı deyilsinizsə, xahiş edirik etirazınızı indi bildirin.",
    be: "Summario транскрыбуе і ствараe пратакол гэтай сустрэчы. Калі вы не згодныя, калі ласка, выказайце сваё запярэчэнне зараз.",
    bs: "Summario transkribuje i generiše zapisnik ovog sastanka. Ako se ne slažete, molimo izrazite svoj prigovor sada.",
    ca: "Summario transcriu i genera actes d'aquesta reunió. Si no hi esteu d'acord, si us plau, expresseu la vostra objecció ara.",
    gl: "Summario transcribe e xera actas desta reunión. Se non está de acordo, exprese a súa obxección agora.",
    el: "Το Summario μεταγράφει και δημιουργεί πρακτικά για αυτή τη σύσκεψη. Εάν δεν συμφωνείτε, παρακαλώ εκφράστε την αντίρρησή σας τώρα.",
    he: "Summario מתמלל ויוצר פרוטוקולים עבור פגישה זו. אם אינך מסכים, אנא הבע את התנגדותך כעת.",
    is: "Summario skrifar og býr til fundargerðir fyrir þennan fund. Ef þú samþykkir ekki, vinsamlegast tjáðu andmæli þín núna.",
    kn: "Summario ಈ ಸಭೆಗಾಗಿ ಪ್ರತಿಲೇಖನ ಮತ್ತು ಕಾರ್ಯಪತ್ರಿಕೆಗಳನ್ನು ಸೃಷ್ಟಿಸುತ್ತಿದೆ. ನೀವು ಒಪ್ಪದಿದ್ದರೆ, ದಯವಿಟ್ಟು ಈಗ ನಿಮ್ಮ ಆಕ್ಷೇಪಣೆಯನ್ನು ತಿಳಿಸಿ.",
    kk: "Summario осы кездесуге арналған транскрипция мен хаттамаларды жасайды. Егер келіспесеңіз, қазір қарсылығыңызды білдіріңіз.",
    mk: "Summario транскрибира и генерира записници за овој состанок. Ако не се согласувате, ве молиме изразете го вашиот приговор сега.",
    ms: "Summario sedang menyalin dan menjana minit untuk mesyuarat ini. Jika anda tidak bersetuju, sila nyatakan bantahan anda sekarang.",
    mr: "Summario या बैठकीसाठी प्रतिलेखन आणि कार्यवृत्त तयार करत आहे. जर तुमची सहमती नसेल तर कृपया आता तुमचा आक्षेप नोंदवा.",
    mi: "Kei te tuhituhi a Summario me te hanga miniti mo tenei hui. Ki te kore koe e whakaae, tena koa whakapuaki to tautohe inaianei.",
    ne: "Summario यस बैठकको लागि ट्रान्सक्रिप्शन र मिनेट सिर्जना गर्दैछ। यदि तपाईं सहमत हुनुहुन्न भने, कृपया अहिले आफ्नो आपत्ति व्यक्त गर्नुहोस्।",
    fa: "Summario در حال رونویسی و ایجاد صورتجلسه برای این جلسه است. اگر موافق نیستید، لطفاً اعتراض خود را اکنون بیان کنید.",
    sr: "Summario транскрибује и генерише записнике за овај састанак. Ако се не слажете, молимо изразите свој приговор сада.",
    sw: "Summario inaandika na kuunda kumbukumbu za kikao hiki. Usipopatana nayo, tafadhali toa pingamizi lako sasa.",
    tl: "Nag-transcribe at gumagawa ng mga minuto si Summario para sa pulong na ito. Kung hindi ka sumasang-ayon, mangyaring ipahayag ang inyong tutol ngayon.",
    ta: "இந்த கூட்டத்திற்கு Summario பதிவு மற்றும் நிமிடங்களை உருவாக்குகிறது. நீங்கள் ஒப்புக்கொள்ளவில்லை என்றால், தயவுசெய்து இப்போது உங்கள் ஆட்சேபனையை தெரிவிக்கவும்.",
    ur: "Summario اس میٹنگ کے لیے نقل اور منٹس بنا رہا ہے۔ اگر آپ متفق نہیں ہیں تو براہ کرم ابھی اپنا اعتراض ظاہر کریں۔",
    cy: "Mae Summario yn trawsgrifio ac yn creu cofnodion ar gyfer y cyfarfod hwn. Os nad ydych chi'n cytuno, mynegwch eich gwrthwynebiad nawr os gwelwch yn dda.",
  };

  // Return message in specified language, fallback to English
  return messages[language] || messages.en;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMeetingRequest = await request.json();
    const {
      meeting_name,
      meeting_url,
      agenda_topics,
      start_time_option,
      scheduled_start_datetime,
      enable_diarization,
      language = "auto",
      send_initial_message = true,
    } = body;

    // Validate required fields
    if (!meeting_name || !meeting_url || !agenda_topics || !start_time_option) {
      return NextResponse.json(
        {
          error:
            "meeting_name, meeting_url, agenda_topics, and start_time_option are required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(agenda_topics) || agenda_topics.length === 0) {
      return NextResponse.json(
        { error: "agenda_topics must be a non-empty array" },
        { status: 400 }
      );
    }

    if (start_time_option === "scheduled" && !scheduled_start_datetime) {
      return NextResponse.json(
        {
          error:
            "scheduled_start_datetime is required when start_time_option is 'scheduled'",
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate Skribby API key
    if (!process.env.SKRIBBY_API_KEY) {
      console.error("SKRIBBY_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing API key" },
        { status: 500 }
      );
    }

    // Determine the service from the meeting URL
    const service = determineService(meeting_url);

    // Default to true if no setting provided (defaults to assembly-ai)
    const enableDiarization = enable_diarization !== false;

    // Determine transcription model based on diarization setting
    const transcriptionModel = enableDiarization ? "deepgram-v3" : "whisper";

    // Map language codes based on transcription model
    let apiLanguage: string | undefined;
    if (language !== "auto") {
      if (transcriptionModel === "deepgram-v3") {
        // Deepgram Nova-3 supported languages
        const deepgramLanguages: Record<string, string> = {
          en: "en-US",
          de: "de",
          nl: "nl",
          sv: "sv-SE",
          da: "da-DK",
          es: "es",
          fr: "fr",
          pt: "pt",
          it: "it",
          tr: "tr",
          no: "no",
          id: "id",
          hi: "hi",
          pl: "pl",
          ja: "ja",
          ru: "ru",
          ko: "ko",
          vi: "vi",
        };
        apiLanguage = deepgramLanguages[language] || "multi"; // Default to multilingual
      } else {
        // Whisper supported languages (first letter uppercase)
        const whisperLanguages: Record<string, string> = {
          af: "Afrikaans",
          ar: "Arabic",
          hy: "Armenian",
          az: "Azerbaijani",
          be: "Belarusian",
          bs: "Bosnian",
          bg: "Bulgarian",
          ca: "Catalan",
          zh: "Chinese",
          hr: "Croatian",
          cs: "Czech",
          da: "Danish",
          nl: "Dutch",
          en: "English",
          et: "Estonian",
          fi: "Finnish",
          fr: "French",
          gl: "Galician",
          de: "German",
          el: "Greek",
          he: "Hebrew",
          hi: "Hindi",
          hu: "Hungarian",
          is: "Icelandic",
          id: "Indonesian",
          it: "Italian",
          ja: "Japanese",
          kn: "Kannada",
          kk: "Kazakh",
          ko: "Korean",
          lv: "Latvian",
          lt: "Lithuanian",
          mk: "Macedonian",
          ms: "Malay",
          mr: "Marathi",
          mi: "Maori",
          ne: "Nepali",
          no: "Norwegian",
          fa: "Persian",
          pl: "Polish",
          pt: "Portuguese",
          ro: "Romanian",
          ru: "Russian",
          sr: "Serbian",
          sk: "Slovak",
          sl: "Slovenian",
          es: "Spanish",
          sw: "Swahili",
          sv: "Swedish",
          tl: "Tagalog",
          ta: "Tamil",
          th: "Thai",
          tr: "Turkish",
          uk: "Ukrainian",
          ur: "Urdu",
          vi: "Vietnamese",
          cy: "Welsh",
        };
        apiLanguage = whisperLanguages[language]; // Use exact match, no fallback
      }
    }

    // Construct the base request payload for the Skribby API
    const skribbyPayload: any = {
      transcription_model: transcriptionModel,
      service: service,
      meeting_url: meeting_url,
      bot_name: "Summario Bot",
      webhook_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/meeting-callback`,
    };

    skribbyPayload.stop_options = {
      ...(skribbyPayload.stop_options || {}),
      last_person_detection: 0,
    };

    // Add language if specified
    if (apiLanguage) {
      skribbyPayload.lang = apiLanguage;
    }

    // Add initial chat message if requested
    if (send_initial_message) {
      const messageLanguage = language === "auto" ? "en" : language;
      skribbyPayload.initial_chat_message =
        getIntroductoryMessage(messageLanguage);
    }

    // Conditional start time logic
    if (start_time_option === "scheduled" && scheduled_start_datetime) {
      const scheduledUnixTimestamp = convertISOtoUnix(scheduled_start_datetime);
      skribbyPayload.scheduled_start_time = scheduledUnixTimestamp;
    }

    // Make the POST request to the Skribby API
    const skribbyResponse = await fetch(
      "https://platform.skribby.io/api/v1/bot",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SKRIBBY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(skribbyPayload),
      }
    );

    if (!skribbyResponse.ok) {
      const responseText = await skribbyResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { raw_response: responseText };
      }

      console.error("Skribby API error details:", {
        status: skribbyResponse.status,
        statusText: skribbyResponse.statusText,
        headers: Object.fromEntries(skribbyResponse.headers.entries()),
        body: errorData,
      });

      // Handle specific error cases with user-friendly messages
      if (skribbyResponse.status === 521) {
        return NextResponse.json(
          {
            error:
              "The meeting transcription service is temporarily unavailable. Please try again in a few minutes.",
            technical_details: "Skribby platform server is down (Error 521)",
          },
          { status: 503 }
        );
      }

      if (skribbyResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              "Authentication failed with the transcription service. Please contact support.",
            technical_details: "Invalid API key",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: `Failed to create meeting bot (${skribbyResponse.status}): ${
            errorData.message ||
            errorData.error ||
            "Service temporarily unavailable"
          }`,
          technical_details: responseText.slice(0, 200) + "...",
        },
        { status: 500 }
      );
    }

    const skribbyBot = await skribbyResponse.json();
    const skribbyBotId = skribbyBot.id;

    const agendaTopicsWithIds = agenda_topics.map((topic, index) => ({
      ...topic,
      id: index.toString(),
    }));

    // Insert a new row into the 'public.meetings' table in Supabase
    const { data: meeting, error: insertError } = await supabase
      .from("meetings")
      .insert({
        user_id: user.id,
        skribby_bot_id: skribbyBotId,
        meeting_name: meeting_name,
        meeting_url: meeting_url,
        agenda_topics: agendaTopicsWithIds,
        enable_diarization: enableDiarization,
        status: start_time_option === "scheduled" ? "SCHEDULED" : "INITIALIZED",
        scheduled_start_datetime:
          start_time_option === "scheduled" ? scheduled_start_datetime : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save meeting to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, meeting_id: meeting.meeting_id });
  } catch (error) {
    console.error("Error in create-meeting API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
