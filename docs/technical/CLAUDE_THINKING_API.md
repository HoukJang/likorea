# Claude Extended Thinking API Documentation

## Overview
Claude 4 models support extended thinking capabilities through special beta headers. This feature allows Claude to perform sophisticated reasoning during API interactions, particularly useful for complex problem-solving and tool-based interactions.

## Beta Header Configuration

### Interleaved Thinking
**Header Name**: `anthropic-beta`  
**Header Value**: `interleaved-thinking-2025-05-14`

This enables Claude to think between tool calls, providing more nuanced and intelligent responses.

### Important Notes
- **Model Compatibility**: Only works with Claude 4 models (Opus 4, Sonnet 4)
- **Platform Support**: 
  - ✅ Direct Anthropic API calls
  - ⚠️ Limited on 3rd-party platforms (AWS Bedrock, Vertex AI)
- **Response Format**: Returns summarized thinking process to prevent misuse

## Implementation Guide

### 1. Basic Configuration
```javascript
const headers = {
  'anthropic-beta': 'interleaved-thinking-2025-05-14'
};

const response = await anthropic.messages.create(apiParams, { headers });
```

### 2. Multiple Beta Features
To use multiple beta features, combine them with commas:
```javascript
const headers = {
  'anthropic-beta': 'interleaved-thinking-2025-05-14,max-tokens-3-5-sonnet-2024-07-15'
};
```

### 3. Model-Specific Configuration
```javascript
const CLAUDE_MODELS = [
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus',
    supportThinking: true,
    betaHeader: 'interleaved-thinking-2025-05-14'
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    supportThinking: true,
    betaHeader: 'interleaved-thinking-2025-05-14'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    supportThinking: false,
    betaHeader: 'max-tokens-3-5-sonnet-2024-07-15'  // For 8K output
  }
];
```

## Response Handling

### With Thinking Enabled
```javascript
const message = await anthropic.messages.create(apiParams, { headers });

// Check for thinking content
if (message.thinking) {
  console.log('Claude\'s thinking process:', message.thinking);
}

// Main response
const response = message.content[0].text;
```

### Thinking Response Structure
```json
{
  "content": [
    {
      "type": "text",
      "text": "Main response content"
    }
  ],
  "thinking": "Summarized thinking process...",
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 567
  }
}
```

## Best Practices

### 1. Error Handling
```javascript
try {
  const message = await anthropic.messages.create(apiParams, { headers });
} catch (error) {
  if (error.status === 400 && error.message.includes('anthropic-beta')) {
    // Invalid beta header - fallback to no beta features
    const message = await anthropic.messages.create(apiParams);
  }
}
```

### 2. Feature Detection
```javascript
function supportsThinking(modelId) {
  return modelId.includes('claude-opus-4') || modelId.includes('claude-sonnet-4');
}

function getBetaHeaders(bot) {
  const headers = {};
  const modelConfig = CLAUDE_MODELS.find(m => m.id === bot.aiModel);
  
  // Only add thinking header for Claude 4 models
  if (bot.apiSettings?.enableThinking && modelConfig?.supportThinking) {
    headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
  }
  
  // Add other beta features as needed
  if (modelConfig?.betaHeader && !bot.apiSettings?.enableThinking) {
    headers['anthropic-beta'] = modelConfig.betaHeader;
  }
  
  return headers;
}
```

### 3. Dynamic Configuration
```javascript
const apiSettings = {
  enableThinking: true,  // Enable/disable thinking mode
  maxTokens: 8192,       // Adjust based on model
  temperature: 0.7,      // Lower for more focused thinking
  topP: 0.95,
  topK: 0
};
```

## Common Issues and Solutions

### Issue 1: Invalid Beta Header Error
**Error**: `Unexpected value(s) 'thinking-2025-05-14' for the 'anthropic-beta' header`  
**Solution**: Use the correct header value: `interleaved-thinking-2025-05-14`

### Issue 2: Model Compatibility
**Error**: Request fails on non-Claude 4 models  
**Solution**: Check model compatibility before adding thinking header

### Issue 3: Platform Limitations
**Error**: Thinking not working on AWS Bedrock  
**Solution**: Only use with direct Anthropic API calls for full compatibility

## Migration Guide

### From Invalid Headers
```javascript
// ❌ Old (incorrect)
headers['anthropic-beta'] = 'thinking-2025-05-14';

// ✅ New (correct)
headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
```

### From Hardcoded Configuration
```javascript
// ❌ Old (hardcoded)
if (bot.apiSettings?.enableThinking) {
  headers['anthropic-beta'] = 'thinking-2025-05-14';
}

// ✅ New (dynamic with validation)
const modelConfig = CLAUDE_MODELS.find(m => m.id === bot.aiModel);
if (bot.apiSettings?.enableThinking && modelConfig?.supportThinking) {
  headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
}
```

## Available Beta Headers (as of 2025)

| Header Value | Purpose | Compatible Models |
|-------------|---------|-------------------|
| `interleaved-thinking-2025-05-14` | Extended thinking between tool calls | Claude 4 Opus, Claude 4 Sonnet |
| `max-tokens-3-5-sonnet-2024-07-15` | 8,192 token output | Claude 3.5 Sonnet |
| `token-efficient-tools-2025-02-19` | Token efficiency (deprecated) | All models (no effect on Claude 4) |

## Testing

### Test Script
```javascript
async function testThinkingMode(bot) {
  const testPrompt = "Analyze this complex problem step by step...";
  
  const apiParams = {
    model: bot.aiModel,
    max_tokens: bot.apiSettings.maxTokens,
    temperature: bot.apiSettings.temperature,
    system: bot.prompt.system,
    messages: [{ role: "user", content: testPrompt }]
  };
  
  const headers = getBetaHeaders(bot);
  
  try {
    const message = await anthropic.messages.create(apiParams, { headers });
    
    console.log('Success! Thinking mode active:', !!message.thinking);
    console.log('Response:', message.content[0].text.substring(0, 200));
    
    if (message.thinking) {
      console.log('Thinking summary:', message.thinking.substring(0, 500));
    }
    
    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}
```

## References
- [Anthropic API Documentation](https://docs.anthropic.com/en/api/messages)
- [Building with Extended Thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
- [Claude 4 Migration Guide](https://docs.anthropic.com/en/docs/about-claude/models/migrating-to-claude-4)
- [API Release Notes](https://docs.anthropic.com/en/release-notes/api)