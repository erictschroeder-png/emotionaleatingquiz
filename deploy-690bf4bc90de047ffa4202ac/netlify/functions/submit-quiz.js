const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { firstName, email, primaryType, primaryTypeName, secondaryType, scores } = JSON.parse(event.body);

    const sequenceMap = {
      'type1': process.env.KIT_SEQUENCE_TYPE1,
      'type2': process.env.KIT_SEQUENCE_TYPE2,
      'type3': process.env.KIT_SEQUENCE_TYPE3,
      'type4': process.env.KIT_SEQUENCE_TYPE4
    };

    const tagMap = {
      'type1': 'Quiz Result: Stress Reactor',
      'type2': 'Quiz Result: Comfort Seeker',
      'type3': 'Quiz Result: Perfectionist Rebel',
      'type4': 'Quiz Result: Overwhelmed Escapist'
    };

    const sequenceId = sequenceMap[primaryType];
    const primaryTag = tagMap[primaryType];

    if (!sequenceId) {
      throw new Error('Invalid quiz type');
    }

    // Add tag to subscriber
    await fetch(`https://api.convertkit.com/v3/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.KIT_API_KEY,
        tag: { name: primaryTag },
        email: email,
        first_name: firstName,
        fields: {
          quiz_type: primaryTypeName,
          quiz_secondary: secondaryType,
          quiz_date: new Date().toISOString()
        }
      })
    });

    // Subscribe to sequence
    await fetch(`https://api.convertkit.com/v3/sequences/${sequenceId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.KIT_API_KEY,
        email: email,
        first_name: firstName,
        fields: {
          quiz_type: primaryTypeName,
          quiz_secondary: secondaryType
        }
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        primaryType: primaryType,
        message: 'Successfully subscribed to sequence'
      })
    };

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Submission failed',
        details: error.message 
      })
    };
  }
};