export async function handler(event) {
  return {
    statusCode: event,
    body: JSON.stringify({
      hello: 'Deu boa! Vamos logar...',
    }),
  };
}
