// components/TonWalletSetup.tsx
export function TonWalletSetup() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-semibold">Need a TON Wallet?</h4>
      <p className="text-sm text-muted-foreground">
        Download one of these wallets to pay with TON:
      </p>

      <div className="grid grid-cols-2 gap-2">
        <a
          href="https://tonkeeper.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 border rounded-lg hover:bg-gray-50 text-center"
        >
          <div className="font-medium">Tonkeeper</div>
          <div className="text-xs text-muted-foreground">Mobile & Desktop</div>
        </a>

        <a
          href="https://tonwallet.me"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 border rounded-lg hover:bg-gray-50 text-center"
        >
          <div className="font-medium">TON Wallet</div>
          <div className="text-xs text-muted-foreground">Mobile</div>
        </a>

        <a
          href="https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 border rounded-lg hover:bg-gray-50 text-center"
        >
          <div className="font-medium">TON Wallet</div>
          <div className="text-xs text-muted-foreground">Browser Extension</div>
        </a>

        <a
          href="https://trustwallet.com/ton-wallet"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 border rounded-lg hover:bg-gray-50 text-center"
        >
          <div className="font-medium">Trust Wallet</div>
          <div className="text-xs text-muted-foreground">Mobile</div>
        </a>
      </div>

      <div className="text-xs text-muted-foreground">
        💡 TIP: You can buy TON on exchanges like Binance, OKX, or KuCoin
      </div>
    </div>
  );
}
