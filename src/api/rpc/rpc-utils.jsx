const valueOfAssetName = (asset) => {
  const bytes = new Uint8Array(8);
  bytes.set(new TextEncoder().encode(asset));
  return new DataView(bytes.buffer).getBigInt64(0, true);
};

export const createQXOrderPayload = (
  issuer,
  assetName,
  price,
  numberOfShares
) => {
  return new QubicTransferQXOrderPayload({
    issuer: new PublicKey(issuer),
    assetName: new Long(valueOfAssetName(assetName)),
    price: new Long(price),
    numberOfShares: new Long(numberOfShares),
  });
};

export const fetchAssetOrders = async (assetName, issuerID, type, offset) => {
  return await fetch(
    `${api}/v1/qx/getAsset${type}Orders?assetName=${assetName}&issuerId=${issuerID}&offset=${offset}`,
    { method: 'GET' }
  );
};
