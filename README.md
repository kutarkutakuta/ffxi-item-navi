# FF11装備Navi
ファイナルファンタジーXI(FF11)の装備品や食品を検索ナビゲートするWebアプリケーションです。  
装備セットを作成してステータスの確認や比較、公開も出来ます。  

## URL
https://item-navi.onrender.com/

## Google Play Store
https://play.google.com/store/apps/details?id=com.onrender.item_navi.twa

## 使用技術
- 使用言語: HTML, CSS, LESS, TypeScript
- フレームワーク: Angular 15.1.2, NG-ZORRO 15.1.0
- データベース: PostgreSQL 14.1, IndexedDB (Dexie.js 3.2.3)
- プラットフォーム: [supabase](https://supabase.com/), [render](https://render.com/)
- その他ツール: Github, Visual Studio Code

## 主な機能
### 1. Search
装備品を「ジョブ」「武器」「防具」に加えてフリーワードで検索することが出来ます。  
フリーワードにはクエリ式を使ったステータスの絞り込みが可能です。  
例）「HP」が100以上で「被ダメージ」が-2より小さい装備を検索する場合  
　HP>=100 被ダメージ<-2  
クエリ式は「Query Builder」機能を使用することで直感的に簡単に生成できます。  

### 2. Food
食事をカテゴリーとフリーワードで検索することが出来ます。  
装備品の検索と同様にクエリ式を使った絞り込みが可能です。  

### 3. My Set
ジョブ毎に「装備セット」を作成・保存できます。  
ここの装備検索でもクエリ式を使用することが可能です。  
ステータスは自動で計算されるので「装備セット」の作成が捗ります。  
また、「装備セット」どうしの比較や、「装備セット」を公開することも可能です。  

### 4. 公開List
公開された「装備セット」を一覧表示します。  
気になった「装備セット」があれば「My Set」にコピーして自分の「装備セット」と比較することも出来ます。  

## 作成に至る経緯
### ゲームユーザーとして
FF11は場面によって装備の持ち替えが必要で、オートアタック装備、WS装備、詠唱装備、精霊装備などその場面は多岐にわたります。  
そのため、場面ごとに「装備セット」を作成して切り替えますが、ゲーム上でステータスを確認したり比較するのが簡単ではないので「装備セット」の作成には手間と時間がかかります。
多くのケースで装備を変えると他の装備も変える必要が出てくるので、このループからなかなか抜け出すことが出来ない経験をしたユーザーも多いのではないでしょうか？  
本アプリケーションはその作業を軽減すべく作成しました。  

FF11の装備品検索Webサイトとして有名なmathomさんの「FFXI アイテム検索」というサイトがありますが、こちらの更新が停止されていたのも一因になります。  
※本アプリケーションの作成にあたり、クエリ式を使ったステータスの絞り込みなどインタフェースの部分でかなり参考にさせていただきました。  

なによりも長年FF11を遊んできたユーザーとして、何か貢献出来たら良いなという思いが強くありました。

### 技術者として
Angularを使用したWebアプリケーション開発をだいぶやってきた中で、仕事以外でも何か作れないかと模索していました。  
無料で使えるBaaSやPaaSが増えてきて、維持費をかけずにDBやWebサービスが利用できるようになったのも大きなポイントになります。  

簡単で直感的にさくっと使用できることをコンセプトに、スマホでも扱いやすいレスポンシブデザインを意識しました。  
最終的にはWebアプリケーションをPWA→TWA化することでスマホアプリとして「Google Play Store」に登録しています。

昨今のモダンな開発手法を取り入れつつ、これから流行しそうなプラットフォームを見極める作業は技術者として良い経験値となりました。

---
[Kutakutar@FF11](https://twitter.com/kutakutar_ff11)
