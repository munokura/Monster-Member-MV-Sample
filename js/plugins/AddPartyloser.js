//=============================================================================
// AddPartyloser.js
//=============================================================================

/*:ja
 * @plugindesc ver1.04 戦闘終了時にノートタグ記載のアクターを仲間にします。
 * @author まっつＵＰ
 * 
 * @param animation
 * @text 加入決定アニメーション
 * @desc 加入処理中に加入が決定した場合に
 * 敵の表示と共に表示するアニメーションです。
 * @type animation
 * @default 0
 * 
 * 
 * @param text1
 * @text 加入決定時メッセージ１
 * @desc 加入が決定した時のメッセージ１
 * @default が起き上がった。
 * 
 * @param text2
 * @text 加入決定時メッセージ２
 * @desc 加入が決定した時のメッセージ２
 * @default は仲間になった。
 * 
 * @param textallow
 * @text 加入許可テキスト
 * @desc 加入を許可する選択
 * @default 仲間にする
 * 
 * @param textforbid
 * @text 加入拒否テキスト
 * @desc 加入を許可しない選択
 * @default 拒否する
 *
 * @param enableonce
 * @text 仲間アクター再参加
 * @desc 1回仲間にしたことがあるアクターは
 * パーティにいなくても起き上がらないようにするか
 * @type boolean
 * @default true
 * 
 * @param validBattletest
 * @text 戦闘テスト時有効
 * @desc データベースの戦闘テストでも起き上がり有効か。
 * @type boolean
 * @default true
 * 
 * @param defaultallrate
 * @text ニューゲーム時確率倍率
 * @desc ニューゲーム後自動で代入される確率倍率（百分率）。
 * プラグインコマンドで変更できる値と同様。
 * @type number
 * @min 0
 * @max 100000
 * @default 100
 * 
 * @help
 * 
 * RPGで笑顔を・・・
 * 
 * このヘルプとパラメータの説明をよくお読みになってからお使いください。
 * 
 * ※このプラグインの一部機能は、既存のセーブデータを再開した時に
 * 期待する処理がされない場合があります。
 * その場合はニューゲームまたはイベントテスト等から動作を確認してください。
 * なお、プラグインパラメータ「enableonce」がＯＦＦの場合でも
 * 一回仲間にしたアクターの記録自体はします。影響は判定のみです。
 * 
 * エネミーのノートタグ
 * <APaddrand:x>
 * xには確率を百分率で入れてください。
 * <APaddactorId:x>
 * xはアクターのIDを入れてください。
 * 判定に成功した場合に仲間になります。
 * 
 * 例：<APaddrand:50>
 * 50%の確率で仲間になります。
 * 
 * プラグインコマンド
 * 
 * command:APsetallrate
 * args:
 * 0:百分率
 * 
 * 本来仲間になる確率にかける値を変更します。
 * なお、このコマンドで設定を行わない場合の値は0です。
 * 値が0の場合仲間にすることはできません。
 * 判定はバトル終了時に行われるのでそれまでに適用してください。
 * 
 * 例：APsetallrate 200
 * 仲間になる確率を2倍にします。
 * 
 * 例：APsetallrate 0
 * 仲間にすることはできません。
 * 
 * 仲間になるのは最初に判定に成功した一体のみとなります。
 * (index順に判定します。)
 * アニメーションの設定は位置が「画面」でないものを推奨。
 * 
 * 
 * ver1.01 全体の仲間になる確率と選択肢表示を追加
 * 　　　　 サイドビューアクターの挙動を改善
 * 
 * ver1.02 このコマンドで仲間にしたアクターが外せない不具合を解消
 * 
 * ver1.03 パラメータの追加、セーブデータ情報の追加
 * 
 * ver1.04 MZ版の追加機能マージ
 *          （ニューゲーム時確率倍率、戦闘テスト時有効選択） by munokura
 *  
 *
 * 利用規約(2021/07/25変更)：
 * この作品は マテリアル・コモンズ・ブルー・ライセンスの下に提供されています。
 * https://materialcommons.tk/mtcm-b-summary/
 * クレジット表示：まっつＵＰ
 * 
 */

(function () {

    var parameters = PluginManager.parameters('AddPartyloser');
    var APanimation = Number(parameters['animation'] || 0);
    var APtext1 = String(parameters['text1']);
    var APtext2 = String(parameters['text2']);
    var APtextallow = String(parameters['textallow']);
    var APtextforbid = String(parameters['textforbid']);
    var APenableonce = parameters['enableonce'] === 'true';
    var ValidBattletest = parameters['validBattletest'] === 'true';
    var Defaultallrate = Number(parameters['defaultallrate'] || 0);

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'APsetallrate') {
            var value = Number(args[0]);
            $gameSystem.APsetallrate(value);
        }
    };

    BattleManager.toggleloser = function () {
        if (this._phase !== 'loser') {
            this._phase = 'loser';
        } else {
            this._phase = 'battleEnd';
        }
    };

    var _BattleManager_isBattleEnd = BattleManager.isBattleEnd;
    BattleManager.isBattleEnd = function () {
        var def = _BattleManager_isBattleEnd.call(this);
        return def || this._phase === 'loser';
    };

    var _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function (result) {
        _BattleManager_endBattle.call(this, result);
        // if (result === 0) this.toggleloser();
        this.APendBattleset(result);
    };

    BattleManager.APendBattleset = function (result) {
        if (result === 0 && (ValidBattletest || !this.isBattleTest())) {
            this.toggleloser();
        }
    };

    var _BattleManager_update = BattleManager.update;
    BattleManager.update = function () {
        if (this._phase === 'loser' &&
            !this.isBusy() && !this.updateEvent()) {
            this.toggleloser();
            this.gainloser();
            return;
        }
        _BattleManager_update.call(this);
    };

    BattleManager.gainloser = function () {
        $gameTroop.APAddnoteActor();
    };

    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        _Game_System_initialize.call(this);
        // this.APsetallrate(0);
        this.APsetallrate(Defaultallrate);
        this._APexcludeloser = [];
    };

    Game_System.prototype.APallrate = function () {
        return this._APallrate ? this._APallrate : 0;
    };

    Game_System.prototype.APsetallrate = function (value) {
        this._APallrate = value / 100;
    };

    Game_System.prototype.APpushloser = function (id) {
        if (this._APexcludeloser.contains(id)) return;
        this._APexcludeloser.push(id);
    };

    Game_Enemy.prototype.APnoteloser = function (text) {
        return Number(this.enemy().meta[text] || 0);
    };

    Game_Enemy.prototype.isenableAddloser = function () {
        return this.APnoteloser('APaddrand') > 0 && this.APnoteloser('APaddactorId') > 0;
    };

    Game_Enemy.prototype.isallowrandloser = function () {
        var rate = this.APnoteloser('APaddrand') * $gameSystem.APallrate() / 100;
        return Math.random() < rate;
    };

    Game_Enemy.prototype.gainparty = function () {
        if ($gameTroop._anyname !== null) {
            $gameMessage.newPage();
            $gameMessage.add($gameTroop._anyname + APtext2);
            $gameTroop._anyname = null;
        }
        if ($gameTroop._isaddany) return;
        if (!this.isallowrandloser()) return;
        var actorId = this.APnoteloser('APaddactorId');
        if ($gameParty.gainloser(actorId)) {
            this.displayanime(APanimation);
            this.displayloser(actorId);
        }
    };

    Game_Enemy.prototype.displayanime = function (animeId) {
        var name = this.battlerName();
        var hue = this.battlerHue();
        var scene = SceneManager._scene;
        var APsprite = new Sprite();
        APsprite.bitmap = ImageManager.loadEnemy(name, hue)
        APsprite.bitmap.addLoadListener(function () {
            APsprite.x = Graphics.width / 2 - APsprite.width / 2;
            APsprite.y = Graphics.height / 2 - APsprite.height / 2 - Graphics.height / 10;
        }.bind(scene));
        scene.addChild(APsprite);
        var anime = $dataAnimations[animeId];
        if (anime) {
            var APsprite2 = new Sprite_Base();
            scene.addChild(APsprite2);
            APsprite2.x = Graphics.width / 2;
            APsprite2.y = Graphics.height / 2 - Graphics.height / 10;
            APsprite2.startAnimation(anime, false, 1);
        }
    };

    //選択肢表示と制御の切り替えを行っている。
    Game_Enemy.prototype.displayloser = function (actorId) {
        var name = this.originalName();
        var scene = SceneManager._scene;
        $gameTroop._isaddany = true;

        BattleManager.toggleloser();

        $gameMessage.newPage();
        $gameMessage.add('\\.' + name + APtext1);

        $gameMessage.setChoices([APtextallow, APtextforbid], 0, -1);
        $gameMessage.setChoiceBackground(0);
        $gameMessage.setChoicePositionType(2);
        $gameMessage.setChoiceCallback(function (n) {
            if (n === 0) {
                $gameParty.addActor(actorId);
                $gameTroop._anyname = name;
            }
        }.bind(scene));
    };

    var _Game_Party_setupStartingMembers = Game_Party.prototype.setupStartingMembers;
    Game_Party.prototype.setupStartingMembers = function () {
        _Game_Party_setupStartingMembers.call(this);
        $gameSystem._APexcludeloser = $gameSystem._APexcludeloser.concat(this._actors);
    };

    var _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function (actorId) {
        actorId = Number(actorId);
        $gameSystem.APpushloser(actorId);
        _Game_Party_addActor.call(this, actorId);
    };

    var _Game_Party_removeActor = Game_Party.prototype.removeActor;
    Game_Party.prototype.removeActor = function (actorId) {
        actorId = Number(actorId);
        _Game_Party_removeActor.call(this, actorId);
    };

    Game_Party.prototype.gainloser = function (id) {
        var actor = $gameActors.actor(id);
        var inunit = !this.allMembers().contains(actor);
        if (APenableonce) {
            return inunit && !$gameSystem._APexcludeloser.contains(id);
        } else {
            return inunit;
        }
    };

    var _Game_Troop_clear = Game_Troop.prototype.clear;
    Game_Troop.prototype.clear = function () {
        _Game_Troop_clear.call(this);
        this._isaddany = false;
        this._anyname = null;
    };

    Game_Troop.prototype.APAddnoteActor = function () {
        this.CanAddloser().forEach(function (member) {
            member.gainparty();
        });
    };

    Game_Troop.prototype.CanAddloser = function () {
        return this.deadMembers().filter(function (member) {
            return member.isenableAddloser();
        });
    };

})();
