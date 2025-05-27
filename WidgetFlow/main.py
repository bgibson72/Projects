import sys
import os
import zipfile
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QFileDialog, QLabel, QMessageBox, QListWidget, QListWidgetItem, QHBoxLayout, QAbstractItemView, QScrollArea, QDialog, QDialogButtonBox
from PyQt5.QtGui import QPixmap, QIcon
from PyQt5.QtCore import Qt, QSize
from PIL import Image
import io
import tempfile

class IconGalleryDialog(QDialog):
    def __init__(self, icon_data_list, parent=None):
        super().__init__(parent)
        self.setWindowTitle('Select Icons to Export')
        self.resize(600, 400)
        self.selected_indices = set()
        layout = QVBoxLayout()
        self.list_widget = QListWidget()
        self.list_widget.setSelectionMode(QAbstractItemView.MultiSelection)
        self.list_widget.setViewMode(QListWidget.IconMode)
        self.list_widget.setIconSize(QSize(128, 128))
        self.list_widget.setResizeMode(QListWidget.Adjust)
        self.list_widget.setSpacing(10)
        # Remove file names from display
        for idx, (name, pixmap) in enumerate(icon_data_list):
            item = QListWidgetItem(QIcon(pixmap), "")  # No name
            item.setData(Qt.UserRole, idx)
            self.list_widget.addItem(item)
        layout.addWidget(self.list_widget)
        button_layout = QHBoxLayout()
        self.select_all_btn = QPushButton('Select All')
        self.select_all_btn.clicked.connect(self.select_all)
        button_layout.addWidget(self.select_all_btn)
        self.clear_btn = QPushButton('Clear Selection')
        self.clear_btn.clicked.connect(self.clear_selection)
        button_layout.addWidget(self.clear_btn)
        layout.addLayout(button_layout)
        self.buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        self.buttons.accepted.connect(self.accept)
        self.buttons.rejected.connect(self.reject)
        layout.addWidget(self.buttons)
        self.setLayout(layout)
    def select_all(self):
        self.list_widget.selectAll()
    def clear_selection(self):
        self.list_widget.clearSelection()
    def get_selected_indices(self):
        return [item.data(Qt.UserRole) for item in self.list_widget.selectedItems()]

class IconPackExtractor(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle('IconFlow: Android Icon Pack to PNG Extractor')
        self.layout = QVBoxLayout()
        self.label = QLabel('Select an Android icon pack APK to preview and extract icons as PNGs for iOS.')
        self.layout.addWidget(self.label)
        self.select_button = QPushButton('Select Icon Pack APK')
        self.select_button.clicked.connect(self.open_apk)
        self.layout.addWidget(self.select_button)
        self.setLayout(self.layout)

    def open_apk(self):
        options = QFileDialog.Options()
        file_name, _ = QFileDialog.getOpenFileName(self, 'Open Icon Pack APK or XAPK', '', 'APK/XAPK Files (*.apk *.xapk);;All Files (*)', options=options)
        if not file_name:
            return
        if file_name.lower().endswith('.xapk'):
            # Handle XAPK: extract APKs and let user pick one
            with zipfile.ZipFile(file_name, 'r') as xapk:
                apk_files = [f for f in xapk.namelist() if f.lower().endswith('.apk')]
                if not apk_files:
                    QMessageBox.warning(self, 'No APKs Found', 'No APK files were found in the XAPK.')
                    return
                # Show a dialog to select which APK to use
                # Use a simple selection dialog instead of QFileDialog for listing APKs inside XAPK
                from PyQt5.QtWidgets import QInputDialog
                apk_choice, ok = QInputDialog.getItem(self, 'Select APK from XAPK', 'APK files:', apk_files, 0, False)
                if not ok or not apk_choice:
                    return
                # Extract the selected APK to a temp file
                temp_apk_path = os.path.join(tempfile.gettempdir(), os.path.basename(apk_choice))
                with xapk.open(apk_choice) as apk_src, open(temp_apk_path, 'wb') as apk_dst:
                    apk_dst.write(apk_src.read())
                apk_file = temp_apk_path
            # Continue as normal with the extracted APK
        else:
            apk_file = file_name
        icon_data_list = self.load_icons_for_gallery(apk_file)
        if not icon_data_list:
            QMessageBox.warning(self, 'No Icons Found', 'No icons were found in the APK.')
            return
        dialog = IconGalleryDialog(icon_data_list, self)
        if dialog.exec_() == QDialog.Accepted:
            selected_indices = dialog.get_selected_indices()
            if not selected_indices:
                QMessageBox.information(self, 'No Selection', 'No icons selected for export.')
                return
            out_dir = QFileDialog.getExistingDirectory(self, 'Select Output Folder')
            if not out_dir:
                return
            extracted = self.save_selected_icons(apk_file, icon_data_list, selected_indices, out_dir)
            QMessageBox.information(self, 'Success', f'Exported {extracted} icons to {out_dir}')

    def load_icons_for_gallery(self, apk_file):
        image_exts = ['.png', '.webp', '.jpg', '.jpeg']
        icon_data_list = []
        with zipfile.ZipFile(apk_file, 'r') as apk:
            for file in apk.namelist():
                if any(file.lower().endswith(ext) for ext in image_exts) and ('res/' in file or 'drawable' in file):
                    ext = os.path.splitext(file)[1].lower()
                    icon_name = os.path.basename(file)
                    with apk.open(file) as src:
                        data = src.read()
                        try:
                            if ext == '.png':
                                pixmap = QPixmap()
                                pixmap.loadFromData(data)
                                icon_data_list.append((icon_name, pixmap))
                            elif ext == '.webp' or ext == '.jpg' or ext == '.jpeg':
                                img = Image.open(io.BytesIO(data)).convert('RGBA')
                                buf = io.BytesIO()
                                img.save(buf, format='PNG')
                                pixmap = QPixmap()
                                pixmap.loadFromData(buf.getvalue())
                                icon_data_list.append((icon_name, pixmap))
                        except Exception:
                            continue
        return icon_data_list

    def save_selected_icons(self, apk_file, icon_data_list, selected_indices, out_dir):
        image_exts = ['.png', '.webp', '.jpg', '.jpeg']
        extracted = 0
        with zipfile.ZipFile(apk_file, 'r') as apk:
            for idx in selected_indices:
                icon_name, pixmap = icon_data_list[idx]
                # Find the file in the APK again
                for file in apk.namelist():
                    if os.path.basename(file) == icon_name and any(file.lower().endswith(ext) for ext in image_exts):
                        ext = os.path.splitext(file)[1].lower()
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
                        break
        return extracted

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = IconPackExtractor()
    window.show()
    sys.exit(app.exec_())
