# -*- coding: utf-8 -*-
import os
import glob
import re

# 定義所有需要修復的編碼對應關係
encoding_fixes = {
    # 基本文字
    '工讀生管理平台': '工讀生管理平台',  # 保持不變
    '工讀生': '工讀生',  # 保持不變
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
    '?�發?��??�本?�環境使?�代??': '開發環境和本地環境使用代理',
    '?�產?��??�設（�?後�?要更?�為實�??��?端網?��?': '生產環境配置(最後需要更改為實際後端網址)',
    '如�??�設定環境�??��?使用?��?變數': '如果沒有設定環境變量就使用環境變數',
    '組�?': '組別',
    '時間': '時間',
    '?��?�??': '配置文件',
    '滾動條': '滾動條',
    '更細': '更細',
    '�?': '的',
    
    # 移除多餘符號
    '??': '',
    '�': '',
}

def has_import_api(content):
    """檢查文件是否已經導入 api.js"""
    return 'from "@/config/api"' in content or "from '@/config/api'" in content

def add_import_if_needed(content, file_ext):
    """如果需要,添加 getApiUrl 導入"""
    if file_ext != '.vue' and file_ext != '.js':
        return content
    
    # 檢查是否已有導入
    if has_import_api(content):
        return content
    
    # 檢查是否使用了 getApiUrl
    if 'getApiUrl(' not in content:
        return content
    
    # 為 .vue 文件添加導入
    if file_ext == '.vue':
        if '<script>' in content or '<script setup>' in content:
            # 在 script 標籤後添加導入
            content = re.sub(
                r'(<script[^>]*>)',
                r'\1\nimport { getApiUrl } from "@/config/api";',
                content,
                count=1
            )
    # 為 .js 文件添加導入
    elif file_ext == '.js':
        if 'import' in content:
            # 在第一個 import 之前添加
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.strip().startswith('import'):
                    lines.insert(i, 'import { getApiUrl } from "@/config/api";')
                    break
            content = '\n'.join(lines)
        else:
            # 在文件開頭添加
            content = 'import { getApiUrl } from "@/config/api";\n\n' + content
    
    return content

def fix_localhost_urls(content, file_path):
    """修復所有 localhost:3005 URL"""
    changed = False
    
    # 跳過 api.js 配置文件本身
    if 'config/api.js' in file_path.replace('\\', '/'):
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
    
    # 模式 3: axios.get("http://localhost:3005/api/...")
    pattern3 = r'(axios\.(get|post|put|delete|patch))\s*\(\s*["`\']http://localhost:3005(/api/[^"`\']*)["`\']'
    if re.search(pattern3, content):
        content = re.sub(pattern3, r'\1(getApiUrl("\3")', content)
        changed = True
    
    # 模式 4: const url = "http://localhost:3005/api/..."
    pattern4 = r'([=:]\s*)["`\']http://localhost:3005(/api/[^"`\']*)["`\']'
    if re.search(pattern4, content):
        content = re.sub(pattern4, r'\1getApiUrl("\2")', content)
        changed = True
    
    # 模式 5: 在模板字符串中
    pattern5 = r'\$\{["`\']?http://localhost:3005(/api/[^"`\'}]*)["`\']?\}'
    if re.search(pattern5, content):
        content = re.sub(pattern5, r'${getApiUrl("\1")}', content)
        changed = True
    
    return content, changed

def fix_encoding(content):
    """修復編碼問題"""
    changed = False
    # 先處理較長的模式
    sorted_fixes = sorted(encoding_fixes.items(), key=lambda x: len(x[0]), reverse=True)
    
    for old, new in sorted_fixes:
        if old in content and old != new:
            content = content.replace(old, new)
            changed = True
    
    return content, changed

def process_file(file_path):
    """處理單個文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
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
            
            print(f"✓ 修復 [{', '.join(changes)}]: {file_path}")
            return True
        
        return False
        
    except Exception as e:
        print(f"✗ 錯誤 {file_path}: {e}")
        return False

def main():
    print("=" * 80)
    print("開始批次修復所有問題...")
    print("1. 修復中文編碼錯誤")
    print("2. 替換 localhost:3005 為 getApiUrl()")
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
