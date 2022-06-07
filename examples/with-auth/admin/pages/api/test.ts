import { query } from '.keystone/api';

export default async function test(req: any, res: any) {
  const users = await query.Person.findMany({ query: 'id name email tasks { id label }' });

  res.status(200).json(users);
}
