const API = () => {};

const broadcastTransaction = useCallback(async (transaction) => {
  const encodedTransaction = transaction.encodeTransactionToBase64(
    transaction.getPackageData()
  );
  return await fetch(`${BASE_URL}/v1/broadcast-transaction`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ encodedTransaction }),
  });
}, []);
