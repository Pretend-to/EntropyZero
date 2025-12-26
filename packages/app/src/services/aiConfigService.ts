// packages/app/src/services/aiConfigService.ts

/**
 * Manages client-side AI service configuration,
 * including API base URL and API key.
 *
 * This service is designed for local-first, user-configured AI interactions.
 * For simplicity in this initial implementation, configurations are stored in localStorage.
 * In a production environment, consider using Dexie.js (IndexedDB) for more robust
 * and structured local storage, especially for larger or more complex configurations.
 */

const AI_CONFIG_STORAGE_KEY = 'entropy_zero_ai_config';

interface AiConfig {
  baseUrl: string;
  apiKey: string;
  // Add other AI-related configurations here as needed
}

/**
 * Retrieves the AI configuration from local storage.
 * @returns {AiConfig | null} The stored AI configuration, or null if not found.
 */
export function getAiConfig(): AiConfig | null {
  const storedConfig = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
  if (storedConfig) {
    try {
      return JSON.parse(storedConfig);
    } catch (e) {
      console.error('Failed to parse AI configuration from localStorage', e);
      return null;
    }
  }
  return null;
}

/**
 * Saves the AI configuration to local storage.
 * @param {AiConfig} config The AI configuration to save.
 */
export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save AI configuration to localStorage', e);
  }
}

/**
 * Clears the AI configuration from local storage.
 */
export function clearAiConfig(): void {
  localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
}

/**
 * Validates the provided AI configuration.
 * @param {AiConfig} config The configuration to validate.
 * @returns {boolean} True if the configuration is valid, false otherwise.
 */
export function validateAiConfig(config: AiConfig): boolean {
  return !!config.baseUrl && !!config.apiKey;
}

/**
 * Placeholder for AI API call using the stored configuration.
 * This function would typically interact with a configured AI model.
 * @param {string} prompt The user prompt.
 * @returns {Promise<string>} A promise that resolves with the AI's response.
 */
export async function callAiApi(prompt: string): Promise<string> {
  const config = getAiConfig();
  if (!config || !validateAiConfig(config)) {
    throw new Error('AI configuration is missing or invalid.');
  }

  // Example: Simulating an OpenAI-like completion call
  // In a real scenario, you would use fetch() or a dedicated SDK here.
  console.log(`Calling AI API with Base URL: ${config.baseUrl}`);
  console.log(`Using API Key: ${config.apiKey.substring(0, 5)}...`); // Don't log full key
  console.log(`Prompt: ${prompt}`);

  try {
    // This is a mock API call. Replace with actual fetch to config.baseUrl
    const response = await fetch(`${config.baseUrl}/v1/completions`, { // Example endpoint for OpenAI-like API
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Or a model specified by the user
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AI API call failed: ${response.status} ${response.statusText} - ${errorData.error.message}`);
    }

    const data = await response.json();
    // Assuming the response structure for OpenAI-like completion
    return data.choices[0].text.trim();

  } catch (error) {
    console.error('Error calling AI API:', error);
    throw new Error(`Failed to get response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
