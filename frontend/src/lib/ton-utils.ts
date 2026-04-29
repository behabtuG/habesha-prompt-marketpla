// // lib/ton-utils.ts
// export function generateTonPaymentUrl(
//   walletAddress: string,
//   amount: number,
//   comment?: string
// ): string {
//   // Format: ton://transfer/<address>?amount=<nanoTON>&text=<comment>
//   const nanoTon = Math.round(amount * 1000000000); // Convert TON to nanoTON
//   let url = `ton://transfer/${walletAddress}?amount=${nanoTon}`;

//   if (comment) {
//     url += `&text=${encodeURIComponent(comment)}`;
//   }

//   return url;
// }
// //
// export function generateTonDeepLink(
//   walletAddress: string,
//   amount: number,
//   comment?: string
// ): string {
//   // For TON wallet apps
//   const nanoTon = Math.round(amount * 1000000000);
//   let url = `https://app.tonkeeper.com/transfer/${walletAddress}`;

//   const params = new URLSearchParams();
//   params.append("amount", nanoTon.toString());

//   if (comment) {
//     params.append("comment", comment);
//   }

//   return `${url}?${params.toString()}`;
// }
