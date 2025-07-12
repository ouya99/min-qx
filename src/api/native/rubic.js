import { RUBIC_IP } from './rubic-config';

export const rubic = async (query) => {
  try {
    console.log(query);
    const response = await fetch(`${RUBIC_IP}/${query}`, { method: 'GET' });
    const contentType = response.headers.get('content-type');
    // console.log(query, contentType);
    // console.log(query, await response);

    if (!response.ok) {
      // Handle HTTP errors (like 404 or 500)
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      };
    }
    // const data =
    //   contentType && contentType.includes('application/json')
    //     ? await response.json()
    //     : await response.text();

    try {
      const json = await response.clone().json();
      console.log(json);
      return { success: true, data: json };
    } catch (err) {
      console.warn('Invalid JSON received:', err);
      const text = await response.text();
      return { success: true, data: text };
    }

    // const data = await response.json();
    // return { success: true, data: json };
  } catch (error) {
    // Handle network or parsing errors
    return { success: false, error: error.message };
  }
};
