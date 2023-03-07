from bs4 import BeautifulSoup
from markdown_it import MarkdownIt
import re

#htmlテキストからmarkdownテキストを抜き出しhtmlテキストに変換したのち、元のhtmlテキストに変換したhtmlテキスト追記する
def html_parse(htmltext):
    soup = BeautifulSoup(htmltext,features="html.parser")# BeautifulSoupにhtmlソースを食わせる

    details_mean_box = soup.find(class_="details_mean_box")
    details_eles = details_mean_box.find_all(class_="oneblock")# oneblock要素のリスト
    for oneblock in details_eles:
        flex_textarea_dummy = oneblock.find(class_="flex_textarea_dummy")# flex_textarea_dummy要素を取得
        md_text = flex_textarea_dummy.string# flex_textarea_dummyからmarkdownテキストを取得
        md_text = md_text[0:len(md_text)-1]# zero値を消す
        html_look_text = md.render(md_text)# markdownテキストをhtmlテキストに変換

        look = oneblock.find(class_="look")# look要素を取得
        look.clear()# lookのコンテンツ部をクリアする
        subsoup = BeautifulSoup("<div class='tmp'>"+html_look_text+"</div>",'html.parser')# markdown変換で得られたhtmlテキストをBeautifulSoupに食わせる
        look.append(subsoup.div)# subsoupのtmp要素をlook要素に追加
        tmp = look.find(attrs={"class":"tmp"})# tmp要素を取得
        tmp.unwrap()# tmpタグを取り払う

    #webnote_main_children = soup.find(attrs={"id":"webnote_main"}).contents# webnote_main要素の子要素リストを取得
    webnote_main_children = soup.contents# webnote_main要素の子要素リストを取得
    return(webnote_main_children)

# paragraphのレンダーメソッド
def render_paragraph_open(self, tokens, idx, options, env):
    text = tokens[idx+1].content# 要素のコンテンツとなる部分
    pattern = ["^:c?i[0-9]\s","^:c(i[0-9])?\s"]# インデントと中央配置の正規表現
    repatter0 = re.compile(pattern[0])# compileしたオブジェクトを使うと早い
    repatter1 = re.compile(pattern[1])# compileしたオブジェクトを使うと早い
    style_text = "";stylef_text = "";indent_text = "";r_text = text

    result0 = repatter0.search(text)# text内、正規表現repatter0に一致したものを含むresult0オブジェクト
    #もし文頭に:in があればnの値だけインデントする ※nは0~9のいずれかの値
    if result0!=None:
        opt_text = result0.group()
        indent_num = int(re.search("[0-9]",opt_text).group())
        r_text = repatter0.sub("",text)
        # オプション文字の削除はtokens[idx+1].contentだけでなくtokens[idx+1].children[0].contentも必要
        tokens[idx+1].children[0].content = repatter0.sub("",tokens[idx+1].children[0].content)
        style_text = " style='"
        stylef_text = "'"
        indent_text = "padding-left:"+str(indent_num*26)+"px;"
    
    align_text = ""
    result1 = repatter1.search(text)
    #もし文頭に:c があれば中央に配置
    if result1!=None:
        r_text = repatter1.sub("",text)
        # オプション文字の削除はtokens[idx+1].contentだけでなくtokens[idx+1].children[0].contentも必要
        tokens[idx+1].children[0].content = repatter1.sub("",tokens[idx+1].children[0].content)
        style_text = " style='";
        stylef_text = "'";
        align_text = "text-align:center;";
    
    # オプション文字を削除したr_textをtokens[idx+1].contentに格納
    tokens[idx+1].content = r_text
    return("<p"+style_text + indent_text + align_text + stylef_text+">")

md = MarkdownIt("commonmark").enable("table")
md.add_render_rule("paragraph_open", render_paragraph_open)