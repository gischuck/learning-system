#!/usr/bin/env python3
"""
使用 Google Sheets API 创建工作表
通过 gog 获取 access token 并调用 API
"""

import json
import subprocess
import urllib.request
import urllib.error
import sys

SPREADSHEET_ID = "GOOGLE_SHEETS_ID_PLACEHOLDER"

def get_access_token():
    """通过 gog 获取 access token"""
    # 尝试使用 gog 的内部机制
    # gog 在执行 API 命令时会自动获取 access token
    # 我们可以模拟这个过程
    
    # 读取 credentials
    with open("/root/.config/gogcli/credentials.json") as f:
        creds = json.load(f)
    
    # 读取 refresh token (加密的，需要解密)
    # gog 使用 file keyring，token 是加密存储的
    # 最简单的方法是通过 gog 执行一个 API 调用来触发 token 刷新
    
    # 执行一个简单的 gog 命令来触发认证
    result = subprocess.run(
        ["gog", "sheets", "get", SPREADSHEET_ID, "A1", "--json"],
        capture_output=True,
        text=True
    )
    
    # 检查是否成功
    if result.returncode == 0:
        print("✅ gog 认证成功")
        return True
    else:
        print(f"❌ gog 认证失败: {result.stderr}")
        return False

def create_sheet_via_api(sheet_name):
    """尝试通过直接写入来创建工作表"""
    print(f"正在尝试创建工作表: {sheet_name}")
    
    # 准备表头数据
    headers = {
        "规划表": ["ID", "标题", "类型", "学科", "开始日期", "结束日期", "状态", "优先级", "进度", "负责人", "目标分数", "实际分数", "地点", "老师", "费用", "标签", "描述", "创建时间"],
        "待办事项": ["ID", "标题", "截止日期", "截止时间", "状态", "优先级", "负责人", "关联规划", "重复", "提醒(分钟)", "描述", "完成时间", "创建时间"],
        "便签": ["ID", "标题", "内容", "颜色", "创建时间"]
    }
    
    if sheet_name not in headers:
        print(f"未知的工作表: {sheet_name}")
        return False
    
    data = [headers[sheet_name]]
    data_json = json.dumps(data, ensure_ascii=False)
    
    # 使用 gog 写入数据（这会自动创建工作表）
    cmd = [
        "gog", "sheets", "update",
        SPREADSHEET_ID,
        f"{sheet_name}!A1",
        "--values-json", data_json,
        "--input", "USER_ENTERED"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ 工作表 '{sheet_name}' 创建成功")
        return True
    else:
        # 解析错误
        if "Unable to parse range" in result.stderr:
            print(f"⚠️ 工作表 '{sheet_name}' 不存在，需要手动创建")
        else:
            print(f"❌ 创建失败: {result.stderr}")
        return False

def main():
    print("📝 William 学习规划 - Google Sheets 工作表创建")
    print("=" * 50)
    print(f"Spreadsheet ID: {SPREADSHEET_ID}")
    print()
    
    # 先验证 gog 认证
    if not get_access_token():
        print("请先运行 'gog auth add your-email@gmail.com' 进行认证")
        return 1
    
    print()
    
    # 尝试创建各工作表
    sheets = ["规划表", "待办事项", "便签"]
    success = 0
    
    for sheet in sheets:
        if create_sheet_via_api(sheet):
            success += 1
        print()
    
    print("=" * 50)
    print(f"结果: {success}/{len(sheets)} 个工作表就绪")
    
    if success < len(sheets):
        print()
        print("⚠️ 部分工作表需要手动创建")
        print("请打开 Google Sheets 并添加以下工作表:")
        for sheet in sheets:
            print(f"  - {sheet}")
        print()
        print(f"链接: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())