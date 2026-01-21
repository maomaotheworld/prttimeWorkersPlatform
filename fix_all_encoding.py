# -*- coding: utf-8 -*-
import os
import glob

# 定義所有需要修復的編碼對應關係
replacements = {
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
    '?�發?��??�本?�環境使?�代??': '開發環境和本地環境使用代理',
    '?�產?��??�設（�?後�?要更?�為實�??��?端網?��?': '生產環境配置(最後需要更改為實際後端網址)',
    '如�??�設定環境�??��?使用?��?變數': '如果沒有設定環境變量就使用環境變數',
    
    # 移除多餘符號
    '??': '',
    '�': '',
}

# 要處理的檔案模式
file_patterns = [
    'frontend/src/**/*.vue',
    'frontend/src/**/*.js',
]

def fix_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixed = False
        
        # 先處理較長的模式
        sorted_replacements = sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True)
        
        for old, new in sorted_replacements:
            if old in content:
                content = content.replace(old, new)
                fixed = True
        
        if fixed:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ 修復: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"✗ 錯誤 {file_path}: {e}")
        return False

print("開始批次修復編碼問題...")
print("=" * 60)

total_files = 0
fixed_files = 0

for pattern in file_patterns:
    for file_path in glob.glob(pattern, recursive=True):
        total_files += 1
        if fix_file(file_path):
            fixed_files += 1

print("=" * 60)
print(f"掃描檔案: {total_files}")
print(f"修復檔案: {fixed_files}")
print("完成!")
