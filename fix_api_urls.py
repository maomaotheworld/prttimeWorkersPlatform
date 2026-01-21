import os
import re

# 定義要搜索的目錄
frontend_src = r'c:\Users\evelyn.pan\Downloads\GIT\prttimeWorkersPlatform\frontend\src'

# 要替換的模式
pattern = r'http://localhost:3005(/api/[^"\'`\s]*)'
replacement = r'${API_URL}\1'

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 檢查是否需要導入 getApiUrl
        has_localhost = 'http://localhost:3005' in content
        
        if has_localhost:
            # 先替換 URL
            new_content = content.replace('http://localhost:3005/api/', '')
            new_content = new_content.replace('"http://localhost:3005/api', '"')
            new_content = new_content.replace('`http://localhost:3005/api', '`')
            
            # 使用 getApiUrl
            lines = new_content.split('\n')
            modified = False
            
            for i, line in enumerate(lines):
                if 'fetch(' in line and '"/api/' in line:
                    # 替換 fetch(""/api/...") 為 fetch(getApiUrl("/api/..."))
                    lines[i] = re.sub(r'fetch\("(/api/[^"]*)"', r'fetch(getApiUrl("\1")', line)
                    lines[i] = re.sub(r'fetch\(`(/api/[^`]*)`', r'fetch(getApiUrl(`\1`))', lines[i])
                    modified = True
            
            if modified:
                new_content = '\n'.join(lines)
                
                # 檢查是否需要添加 import
                if 'from "@/config/api"' not in new_content and 'from \'@/config/api\'' not in new_content:
                    # 找到第一個 import 行
                    import_lines = [i for i, line in enumerate(lines) if line.startswith('import ')]
                    if import_lines:
                        last_import = import_lines[-1]
                        lines.insert(last_import + 1, 'import { getApiUrl } from "@/config/api";')
                        new_content = '\n'.join(lines)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f'✓ 已更新: {filepath}')
                return True
    except Exception as e:
        print(f'✗ 錯誤: {filepath} - {str(e)}')
    
    return False

# 遍歷所有文件
updated_files = []
for root, dirs, files in os.walk(frontend_src):
    for file in files:
        if file.endswith('.js') or file.endswith('.vue'):
            filepath = os.path.join(root, file)
            if replace_in_file(filepath):
                updated_files.append(filepath)

print(f'\n總共更新了 {len(updated_files)} 個文件')
