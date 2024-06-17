export const dynamic = 'force-dynamic';

export async function GET() {
  const randomVariableToRecord = 'LOCAL_VARIABLE';
  throw new Error(`Uncaught Local Variable Error - ${JSON.stringify({ randomVariableToRecord })}`);
}
