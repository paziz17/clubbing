/**
 * Club-it virtual loyalty card issuance.
 *
 * The card is an internal loyalty identifier (not a real payment instrument),
 * so we mint a virtual id + last-4 locally. No external card processor.
 */

interface IssueCardParams {
  userId: string;
  cardholderName: string;
  email?: string;
}

export async function issueClubItCard(params: IssueCardParams) {
  const last4 = Math.floor(1000 + Math.random() * 9000).toString();
  return {
    cardId: `cit_${params.userId.slice(0, 8)}_${Date.now().toString(36)}`,
    last4,
  };
}
