import apiClient from './client';

export const uploadImage = async (uri) => {
  const formData = new FormData();
  
  // Create the file object
  // On web, uri might be different, but for native it's usually the file path
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('image', {
    uri: uri,
    name: filename,
    type: type,
  });

  const response = await apiClient.post('/uploads/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
