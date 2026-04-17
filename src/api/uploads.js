import apiClient from './client';

export const uploadImage = async (uri) => {
  const formData = new FormData();
  
  const filename = uri?.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

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
