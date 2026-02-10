# WajuScanner-Online 🚀

A full-stack mobile-first document scanner application with multi-page support, ID card scanning, and OCR capabilities. Transform your physical documents into digital PDFs with advanced image processing and AI-powered text recognition.

## ✨ Features

### 📄 Document Mode
- **Multi-page Scanning**: Scan unlimited pages to create complete documents
- **Page Navigation**: Easily navigate through scanned pages with thumbnails
- **Page Management**: Delete or reorder pages before exporting
- **Working Image Filters**:
  - **Original**: Raw captured image
  - **Magic Color**: Enhanced contrast and brightness for better readability
  - **B&W**: Black & white conversion for clean documents
  - **Grayscale**: Professional grayscale output

### 🆔 ID Card Mode
- **Front + Back Capture**: Scan both sides in one seamless flow
- **Color/Grayscale Options**: Choose output style for your ID card
- **Combined PDF Export**: Front and back saved in a single PDF page

### 🔍 OCR Processing
- **Advanced Text Recognition**: Powered by Tesseract.js
- **AI Enhancement**: Optional AI-powered text refinement via DeepSeek API

### 📤 Export & Share
- **PDF Export**: Generate professional PDFs with all pages
- **Share Function**: Share OCR results via Web Share API
- **Copy Text**: Quick copy text to clipboard

### 💾 Additional Features
- **Scan History**: View recent scans in home screen
- **Local Storage**: Scan history persists between sessions
- **Mobile-First UI**: Optimized for touch interactions
- **Camera & Gallery**: Capture from camera or upload existing images

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite for fast development
- **Tailwind CSS** for modern styling
- **React Image Crop** for precise image cropping
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

### Document Scan Mode

1. Select **Scan Document** from home screen
2. Capture or upload your first page
3. Crop the image if needed
4. Click **Add Page** to add to document
5. Repeat for all pages
6. Apply filters as needed (Original, Magic Color, B&W, Grayscale)
7. Click **Process with OCR** to extract text
8. Click **Export PDF** to download your document

### ID Card Scan Mode

1. Select **Scan ID Card** from home screen
2. Capture the **FRONT** side
3. Capture the **BACK** side
4. Choose **Color** or **Grayscale** output
5. Click **Export ID Card PDF** to download

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

## 🔄 Version History

### v2.0 - Mobile-First Update
- ✅ Multi-page scanning support
- ✅ ID Card/Passport scan mode (Front + Back)
- ✅ Working image filters (Original, Magic Color, B&W, Grayscale)
- ✅ Improved mobile-first UI
- ✅ Page navigation and management
- ✅ Scan history with localStorage
- ✅ Enhanced camera capture quality

### v1.0 - Initial Release
- Single page scanning
- Basic OCR processing
- PDF export
- Web Share API integration

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