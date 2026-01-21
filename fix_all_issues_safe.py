# -*- coding: utf-8 -*-
import os
import glob
import re

# 定義所有需要修復的編碼對應關係
encoding_fixes = {
    # 基本文字
    '工�??�': '工讀生',
    '管�?': '管理',
    '管??': '管理',
    '?��?': '薪資',
    '?�卡': '打卡',
    '?�出': '登出',
    '?�戶': '用戶',
    '?�知': '未知',
    '?�入': '登入',
    '統�?': '統計',
    '資�?': '資訊',
    '彈�?': '彈窗',
    '小�?': '小組',
    '總�??�': '總組別',
    '活�??��?': '活動資料',
    '首�?': '首頁',
    '工�?': '工時',
    '記�?': '記錄',
    '�??': '樣式',
    '?��?�??': '路由配置',
    '環境�??��?': '環境變量',
    '?��?變數': '環境變數',
    
    # 移除多餘符號
    '??': '',
    '�': '',
}

def read_file_safely(file_path):
    """安全地讀取文件,嘗試多種編碼"""
    encodings = ['utf-8', 'utf-8-sig', 'gb18030', 'gbk', 'big5', 'latin1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
            return content, encoding
        except:
            continue
    
    # 如果都失敗,用 latin1 強制讀取(不會失敗)
    with open(file_path, 'r', encoding='latin1') as f:
        content = f.read()
    return content, 'latin1'

def has_import_api(content):
    """檢查文件是否已經導入 api.js"""
    return 'from "@/config/api"' in content or "from '@/config/api'" in content

def add_import_if_needed(content, file_ext):
    """如果需要,添加 getApiUrl 導入"""
    if file_ext != '.vue' and file_ext != '.js':
        return content
    
    if has_import_api(content):
        return content
    
    if 'getApiUrl(' not in content:
        return content
    
    # 為 .vue 文件添加導入
    if file_ext == '.vue':
        if '<script>' in content:
            content = content.replace('<script>', '<script>\nimport { getApiUrl } from "@/config/api";', 1)
        elif '<script setup>' in content:
            content = content.replace('<script setup>', '<script setup>\nimport { getApiUrl } from "@/config/api";', 1)
    # 為 .js 文件添加導入
    elif file_ext == '.js':
        lines = content.split('\n')
        inserted = False
        for i, line in enumerate(lines):
            if line.strip().startswith('import') and 'vue' not in line.lower():
                lines.insert(i, 'import { getApiUrl } from "@/config/api";')
                inserted = True
                break
        if not inserted:
            lines.insert(0, 'import { getApiUrl } from "@/config/api";\n')
        content = '\n'.join(lines)
    
    return content

def fix_localhost_urls(content, file_path):
    """修復所有 localhost:3005 URL"""
    changed = False
    
    # 跳過 api.js 配置文件本身
    if 'config/api.js' in file_path.replace('\\', '/'):
        return content, changed
    
    # 檢查是否有 localhost:3005
    if 'localhost:3005' not in content:
        return content, changed
    
    # 模式 1: fetch("http://localhost:3005/api/...")
    pattern1 = r'fetch\s*\(\s*["`\']http://localhost:3005(/api/[^"`\']*)["`\']'
    if re.search(pattern1, content):
        content = re.sub(pattern1, r'fetch(getApiUrl("\1")', content)
        changed = True
    
    # 模式 2: fetch(`http://localhost:3005/api/...`)
    pattern2 = r'fetch\s*\(\s*`http://localhost:3005(/api/[^`]*)`'
    if re.search(pattern2, content):
        content = re.sub(pattern2, r'fetch(getApiUrl(`\1`)', content)
        changed = True
    
    # 模式 3: "http://localhost:3005/api/..." (簡單字符串)
    pattern3 = r'["`\']http://localhost:3005(/api/[^"`\']*)["`\']'
    if re.search(pattern3, content):
        content = re.sub(pattern3, r'getApiUrl("\1")', content)
        changed = True
    
    return content, changed

def fix_encoding(content):
    """修復編碼問題"""
    changed = False
    sorted_fixes = sorted(encoding_fixes.items(), key=lambda x: len(x[0]), reverse=True)
    
    for old, new in sorted_fixes:
        if old in content and old != new:
            content = content.replace(old, new)
            changed = True
    
    return content, changed

def process_file(file_path):
    """處理單個文件"""
    try:
        content, detected_encoding = read_file_safely(file_path)
        original_content = content
        file_ext = os.path.splitext(file_path)[1]
        
        # 修復編碼問題
        content, encoding_changed = fix_encoding(content)
        
        # 修復 localhost URL
        content, url_changed = fix_localhost_urls(content, file_path)
        
        # 如果修改了 URL,確保有正確的導入
        if url_changed:
            content = add_import_if_needed(content, file_ext)
        
        # 如果有任何更改,保存文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            changes = []
            if encoding_changed:
                changes.append('編碼')
            if url_changed:
                changes.append('URL')
            if detected_encoding != 'utf-8':
                changes.append(f'重編碼:{detected_encoding}→utf-8')
            
            print(f"✓ 修復 [{', '.join(changes)}]: {file_path}")
            return True
        
        return False
        
    except Exception as e:
        print(f"✗ 錯誤 {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 80)
    print("開始批次修復所有問題...")
    print("1. 修復中文編碼錯誤")
    print("2. 替換 localhost:3005 為 getApiUrl()")
    print("3. 統一文件編碼為 UTF-8")
    print("=" * 80)
    print()
    
    # 要處理的檔案模式
    file_patterns = [
        'frontend/src/**/*.vue',
        'frontend/src/**/*.js',
    ]
    
    total_files = 0
    fixed_files = 0
    
    for pattern in file_patterns:
        for file_path in glob.glob(pattern, recursive=True):
            total_files += 1
            if process_file(file_path):
                fixed_files += 1
    
    print()
    print("=" * 80)
    print(f"掃描檔案: {total_files}")
    print(f"修復檔案: {fixed_files}")
    print(f"未修改: {total_files - fixed_files}")
    print("=" * 80)
    print("完成!")

if __name__ == '__main__':
    main()
