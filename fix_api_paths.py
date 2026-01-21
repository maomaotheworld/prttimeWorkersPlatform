# -*- coding: utf-8 -*-
import os
import re
import glob

def fix_api_calls(content, file_path):
    """修復API調用路徑"""
    changed = False
    
    # 跳過已經配置的 api.js
    if 'config/api.js' in file_path.replace('\\', '/'):
        return content, changed
    
    # 檢查是否已經導入 getApiUrl
    has_import = 'from "@/config/api"' in content or "from '@/config/api'" in content
    
    # 模式1: fetch("/api/...") -> fetch(getApiUrl("/api/..."))
    pattern1 = r'fetch\s*\(\s*"(/api/[^"]*)"'
    if re.search(pattern1, content):
        content = re.sub(pattern1, r'fetch(getApiUrl("\1")', content)
        changed = True
    
    # 模式2: fetch(`/api/...`) -> fetch(getApiUrl(`/api/...`))  
    pattern2 = r'fetch\s*\(\s*`(/api/[^`]*)`'
    if re.search(pattern2, content):
        content = re.sub(pattern2, r'fetch(getApiUrl(`\1`))', content)
        changed = True
    
    # 如果有改動且沒有導入，添加導入
    if changed and not has_import:
        # 確定文件類型並添加導入
        if file_path.endswith('.vue'):
            # Vue文件 - 在script標籤後添加
            if '<script setup>' in content:
                content = content.replace(
                    '<script setup>', 
                    '<script setup>\nimport { getApiUrl } from "@/config/api";', 
                    1
                )
            elif '<script>' in content:
                content = content.replace(
                    '<script>', 
                    '<script>\nimport { getApiUrl } from "@/config/api";', 
                    1
                )
        elif file_path.endswith('.js'):
            # JS文件 - 在文件開頭添加
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.strip().startswith('import') and 'vue' not in line.lower():
                    lines.insert(i, 'import { getApiUrl } from "@/config/api";')
                    break
            else:
                lines.insert(0, 'import { getApiUrl } from "@/config/api";\n')
            content = '\n'.join(lines)
    
    return content, changed

def process_file(file_path):
    """處理單個文件"""
    try:
        # 嘗試多種編碼
        content = None
        for encoding in ['utf-8', 'utf-8-sig', 'gb18030', 'gbk']:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except:
                continue
        
        if content is None:
            with open(file_path, 'r', encoding='latin1') as f:
                content = f.read()
        
        original_content = content
        content, api_changed = fix_api_calls(content, file_path)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            changes = []
            if api_changed:
                changes.append('API路徑')
            
            print(f"✓ 修復 [{', '.join(changes)}]: {file_path}")
            return True
        
        return False
        
    except Exception as e:
        print(f"✗ 錯誤 {file_path}: {e}")
        return False

def main():
    print("=" * 80)
    print("修復所有相對 API 路徑為 getApiUrl()")
    print("=" * 80)
    print()
    
    # 需要處理的文件
    patterns = [
        'frontend/src/**/*.vue',
        'frontend/src/**/*.js',
    ]
    
    total_files = 0
    fixed_files = 0
    
    for pattern in patterns:
        for file_path in glob.glob(pattern, recursive=True):
            if 'node_modules' in file_path:
                continue
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