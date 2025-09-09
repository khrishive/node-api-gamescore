import { insertRawEvent } from './eventsRaw.js';

// Este archivo recibe un evento y lo despacha a la función adecuada según el tipo
export async function handleLiveEvent(event, context) {
  const { fixtureId/*, mapNumber, roundNumber*/ } = context;

  // Guarda el evento crudo
  try {
    await insertRawEvent(event, fixtureId, event.type, event.payload?.timestamp ?? Date.now());
  } catch (error) {    
    return {
      success: false,
      message: 'Error to insert raw event',
      error: error.message
    };
  }
  
}
