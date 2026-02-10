# WajuScanner-Online 🚀

A full-stack document scanner application with OCR capabilities, built as a modern alternative to CamScanner. Transform your physical documents into digital text with advanced image processing and AI-powered text recognition.

## ✨ Features

- 📸 **Camera Capture**: Use your device camera to capture documents instantly
- 📁 **File Upload**: Upload images from your gallery
- ✂️ **Smart Cropping**: Intuitive image cropping with visual interface
- 🔍 **OCR Processing**: Advanced text recognition using Tesseract.js
- 🤖 **AI Enhancement**: Optional AI-powered text refinement via DeepSeek API
- 📄 **PDF Export**: Export scanned documents to PDF format
- 📋 **Text Copy**: Copy extracted text to clipboard
- 📤 **Share**: Share results via Web Share API
- 📱 **Mobile Responsive**: Optimized for mobile devices
- 🎨 **Modern UI**: Clean, intuitive interface with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite for fast development
- **Tailwind CSS** for modern styling
- **React Image Crop** for image cropping functionality
- **jsPDF** for PDF generation

### Backend
- **Node.js** with Express framework
- **Tesseract.js** for OCR processing
- **Multer** for file upload handling
- **DeepSeek API** for AI text enhancement (optional)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kamkikorich/wajuonlinescanner.git
   cd wajuonlinescanner
   ```

2. **Setup environment variables**
   ```bash
   # Copy environment template
   cp server/.env.example server/.env.local
   
   # Edit the .env.local file with your API keys
   # Get DeepSeek API key from: https://platform.deepseek.com/
   ```

3. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd camscanner-clone
   npm install
   
   # Install backend dependencies
   cd ../server
   npm install
   ```

4. **Start the application**
   ```bash
   # From root directory
   ./start.bat
   ```

   Or manually:
   ```bash
   # Start backend server
   cd server && node index.js
   
   # Start frontend (in new terminal)
   cd camscanner-clone && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔧 Environment Configuration

### Server Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | `5000` |
| `DEEPSEEK_API_KEY` | Your DeepSeek API key | Required |
| `MAX_FILE_SIZE` | Maximum file upload size in bytes | `5242880` (5MB) |
| `UPLOAD_DIR` | Directory for temporary file uploads | `uploads/` |
| `NODE_ENV` | Node environment | `development` |
| `CORS_ORIGIN` | Frontend URL for CORS configuration | `http://localhost:5173` |
| `TESSERACT_LANG` | OCR language code | `eng` |
| `TESSERACT_PSM` | Tesseract Page Segmentation Mode | `3` |

## 🚀 Usage

1. **Capture or Upload**: Use camera or upload an image containing text
2. **Crop**: Adjust the crop area to focus on the document
3. **Process**: Click "Process with OCR" to extract text
4. **Export**: Save as PDF or copy the extracted text

## 🔒 Security Features

- **File validation**: Only image files are accepted
- **Size limits**: Configurable file size restrictions
- **Environment protection**: Sensitive data in environment variables
- **CORS configuration**: Proper cross-origin setup

## 🎯 OCR Performance Tips

- Use high-contrast images for better recognition
- Ensure good lighting when capturing photos
- Crop unnecessary background areas
- Use the AI enhancement feature for cleaner text output

## 📱 Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

**Note**: Camera functionality requires HTTPS in production environments.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tesseract.js](https://github.com/naptha/tesseract.js) for OCR capabilities
- [DeepSeek](https://deepseek.com/) for AI text enhancement
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Made with ❤️ by the WajuScanner Team**