/**
 * LLM Service
 * Handles integration with multiple LLM providers (Groq, OpenAI, Anthropic, etc.)
 * Provides unified interface for SAR generation with fallback mechanisms
 */

const axios = require('axios');

class LLMService {
  constructor() {
    this.providers = this.initializeProviders();
    this.currentProvider = process.env.LLM_PROVIDER || 'groq';
  }

  /**
   * Initialize available LLM providers
   */
  initializeProviders() {
    return {
      groq: {
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        timeout: 30000,
        fallback: true,
      },
      openai: {
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        timeout: 30000,
        fallback: false,
      },
      anthropic: {
        name: 'Anthropic Claude',
        apiUrl: 'https://api.anthropic.com/v1/messages',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        timeout: 30000,
        fallback: false,
      },
    };
  }

  /**
   * Get the current active provider
   */
  getProvider() {
    const provider = this.providers[this.currentProvider];
    if (!provider) {
      console.warn(`Provider ${this.currentProvider} not found, falling back to groq`);
      this.currentProvider = 'groq';
      return this.providers.groq;
    }
    return provider;
  }

  /**
   * Call Groq LLM API
   */
  async callGroq(prompt, systemMessage) {
    const provider = this.providers.groq;

    if (!provider.apiKey || provider.apiKey === 'your-api-key-here') {
      throw new Error('Groq API key not configured');
    }

    const client = axios.create({
      baseURL: provider.apiUrl,
      timeout: provider.timeout,
    });

    const response = await client.post('', {
      model: provider.model,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    }, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from Groq API');
    }

    return {
      text: response.data.choices[0].message.content,
      model: provider.model,
      provider: 'Groq',
      tokensUsed: response.data.usage?.total_tokens || 0,
      finishReason: response.data.choices[0].finish_reason,
    };
  }

  /**
   * Call OpenAI LLM API
   */
  async callOpenAI(prompt, systemMessage) {
    const provider = this.providers.openai;

    if (!provider.apiKey || provider.apiKey === 'your-api-key-here') {
      throw new Error('OpenAI API key not configured');
    }

    const client = axios.create({
      baseURL: provider.apiUrl,
      timeout: provider.timeout,
    });

    const response = await client.post('', {
      model: provider.model,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }

    return {
      text: response.data.choices[0].message.content,
      model: provider.model,
      provider: 'OpenAI',
      tokensUsed: response.data.usage?.total_tokens || 0,
      finishReason: response.data.choices[0].finish_reason,
    };
  }

  /**
   * Call Anthropic Claude API
   */
  async callAnthropic(prompt, systemMessage) {
    const provider = this.providers.anthropic;

    if (!provider.apiKey || provider.apiKey === 'your-api-key-here') {
      throw new Error('Anthropic API key not configured');
    }

    const client = axios.create({
      baseURL: provider.apiUrl,
      timeout: provider.timeout,
    });

    const response = await client.post('', {
      model: provider.model,
      max_tokens: 3000,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });

    if (!response.data.content || response.data.content.length === 0) {
      throw new Error('No response from Anthropic API');
    }

    return {
      text: response.data.content[0].text,
      model: provider.model,
      provider: 'Anthropic',
      tokensUsed: response.data.usage?.output_tokens || 0,
      finishReason: response.data.stop_reason,
    };
  }

  /**
   * Generate text using LLM with provider fallback
   */
  async generateText(prompt, systemMessage) {
    const primaryProvider = this.currentProvider;
    let lastError = null;

    console.log(`[LLM] Attempting to generate text using ${primaryProvider}`);

    // Try primary provider
    try {
      const result = await this.callProvider(primaryProvider, prompt, systemMessage);
      console.log(`[LLM] Successfully generated text using ${primaryProvider}`);
      return result;
    } catch (error) {
      console.error(`[LLM] Error with ${primaryProvider}:`, error.message);
      lastError = error;
    }

    // Try fallback providers if primary fails
    const fallbackProviders = ['groq', 'openai', 'anthropic'].filter(p => p !== primaryProvider);

    for (const provider of fallbackProviders) {
      try {
        console.log(`[LLM] Attempting fallback to ${provider}`);
        const result = await this.callProvider(provider, prompt, systemMessage);
        console.log(`[LLM] Successfully generated text using ${provider}`);
        return result;
      } catch (error) {
        console.error(`[LLM] Error with ${provider}:`, error.message);
        lastError = error;
      }
    }

    // All providers failed
    throw new Error(`All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Call specific provider
   */
  async callProvider(provider, prompt, systemMessage) {
    switch (provider) {
      case 'groq':
        return await this.callGroq(prompt, systemMessage);
      case 'openai':
        return await this.callOpenAI(prompt, systemMessage);
      case 'anthropic':
        return await this.callAnthropic(prompt, systemMessage);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Set the active LLM provider
   */
  setProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    this.currentProvider = providerName;
    console.log(`[LLM] Switched to ${providerName}`);
  }

  /**
   * Get available providers and their configuration status
   */
  getAvailableProviders() {
    const available = {};
    for (const [name, config] of Object.entries(this.providers)) {
      available[name] = {
        name: config.name,
        model: config.model,
        configured: !!(config.apiKey && config.apiKey !== 'your-api-key-here'),
        isCurrent: name === this.currentProvider,
      };
    }
    return available;
  }
}

module.exports = LLMService;
