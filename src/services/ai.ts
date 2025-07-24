import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export async function transcribeAudio(fileBuffer: Buffer): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
  });

  const audioMimeType = 'audio/m4a';

  const audioPart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType: audioMimeType,
    },
  };

  const prompt =
    'Transcreva este áudio em português. Retorne apenas o texto transcrito.';

  const result = await model.generateContent([prompt, audioPart]);

  const transcription = result.response.text();

  if (!transcription) {
    throw new Error('Falha ao transcrever o áudio.');
  }

  return transcription;
}

type GetMealDetailsFromTextParams = {
  text: string;
  createdAt: Date;
};

export async function getMealDetailsFromText({
  createdAt,
  text,
}: GetMealDetailsFromTextParams) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    safetySettings,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `
    Você é um nutricionista. Analise a descrição da refeição de um paciente.

    Instruções:
    1. Dê um nome e escolha um emoji para a refeição baseado no horário em que foi feita (${createdAt.toLocaleTimeString(
      'pt-BR',
    )}).
    2. Identifique os alimentos na descrição.
    3. Estime os valores nutricionais para cada alimento.
    4. Retorne apenas os dados em JSON, sem explicações adicionais.

    Data da refeição: ${createdAt.toISOString()}
    Descrição da refeição: "${text}"

    O formato de saída JSON deve ser:
    {
      "name": "Nome da Refeição",
      "icon": "🍽️",
      "foods": [
        {
          "name": "Nome do Alimento",
          "quantity": "100g",
          "calories": 150,
          "carbohydrates": 30,
          "proteins": 5,
          "fats": 1.5
        }
      ]
    }
  `;

  const result = await model.generateContent(prompt);
  const json = result.response.text();

  if (!json) {
    throw new Error('Failed to process meal from text.');
  }

  return JSON.parse(json);
}

async function urlToGoogleGenerativeAIPart(url: string, mimeType: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString('base64'),
      mimeType,
    },
  };
}

type GetMealDetailsFromImageParams = {
  imageURL: string;
  createdAt: Date;
};

export async function getMealDetailsFromImage({
  createdAt,
  imageURL,
}: GetMealDetailsFromImageParams) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    safetySettings,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const imagePart = await urlToGoogleGenerativeAIPart(imageURL, 'image/jpeg');

  const prompt = `
    Você é um nutricionista especialista em análise de alimentos por imagem.

    Instruções:
    1. A imagem contém uma refeição de um paciente.
    2. Com base no horário (${createdAt.toLocaleTimeString(
      'pt-BR',
    )}), dê um nome e um emoji para a refeição.
    3. Identifique cada alimento na imagem.
    4. Estime a quantidade e os valores nutricionais de cada um.
    5. Retorne os dados em JSON, sem texto ou explicações adicionais.

    O formato de saída JSON deve ser:
    {
      "name": "Nome da Refeição",
      "icon": "🍽️",
      "foods": [
        {
          "name": "Nome do Alimento",
          "quantity": "100g",
          "calories": 150,
          "carbohydrates": 30,
          "proteins": 5,
          "fats": 1.5
        }
      ]
    }
  `;

  const result = await model.generateContent([prompt, imagePart]);
  const json = result.response.text();

  if (!json) {
    throw new Error('Failed to process meal from image.');
  }

  return JSON.parse(json);
}
