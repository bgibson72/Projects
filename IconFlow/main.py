import sys
import os
import zipfile
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QFileDialog, QLabel, QMessageBox
from PyQt5.QtGui import QPixmap
from PIL import Image
import io

class IconPackExtractor(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle('IconFlow: Android Icon Pack to PNG Extractor')
        self.layout = QVBoxLayout()
        self.label = QLabel('Select an Android icon pack APK to extract icons as PNGs for iOS.')
        self.layout.addWidget(self.label)
        self.select_button = QPushButton('Select Icon Pack APK')
        self.select_button.clicked.connect(self.open_apk)
        self.layout.addWidget(self.select_button)
        self.setLayout(self.layout)

    def open_apk(self):
        options = QFileDialog.Options()
        apk_file, _ = QFileDialog.getOpenFileName(self, 'Open Icon Pack APK', '', 'APK Files (*.apk);;All Files (*)', options=options)
        if not apk_file:
            return
        out_dir = QFileDialog.getExistingDirectory(self, 'Select Output Folder')
        if not out_dir:
            return
        extracted = self.extract_icons(apk_file, out_dir)
        if extracted:
            QMessageBox.information(self, 'Success', f'Extracted {extracted} icons to {out_dir}')
        else:
            QMessageBox.warning(self, 'No Icons Found', 'No icons were extracted from the APK.')

    def extract_icons(self, apk_file, out_dir):
        image_exts = ['.png', '.webp', '.jpg', '.jpeg']
        extracted = 0
        with zipfile.ZipFile(apk_file, 'r') as apk:
            for file in apk.namelist():
                if any(file.lower().endswith(ext) for ext in image_exts) and ('res/' in file or 'drawable' in file):
                    ext = os.path.splitext(file)[1].lower()
                    icon_name = os.path.basename(file)
                    out_path = os.path.join(out_dir, os.path.splitext(icon_name)[0] + '.png')
                    with apk.open(file) as src:
                        data = src.read()
                        try:
                            if ext == '.png':
                                with open(out_path, 'wb') as dst:
                                    dst.write(data)
                                extracted += 1
                            elif ext == '.webp' or ext == '.jpg' or ext == '.jpeg':
                                img = Image.open(io.BytesIO(data)).convert('RGBA')
                                img.save(out_path, 'PNG')
                                extracted += 1
                        except Exception:
                            continue
        return extracted

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = IconPackExtractor()
    window.show()
    sys.exit(app.exec_())
