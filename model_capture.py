# TODO:
# Cinema4D自体を、強制終了しないで停止可能にする
# エラー時に、カメラ位置を初期状態に戻す
# カメラ取得後の、camera object type check
# SaveFolderOpenの、Windows対応
#
# Usage:
# 1、前準備として、Cinema4Dで、ターゲットカメラを作成し、「main_target_camera」と名前をつけ、ターゲット設定を行っておく
#
# 他の方法:
# 複数のカメラアングルを一度にレンダリング
# https://www.youtube.com/watch?v=9AHS5y6avSg

import pprint, os, errno, subprocess, math, time
import c4d
from c4d import utils, gui, storage, bitmaps, documents

DEGREE_MIN                = 0
DEGREE_MAX                = 360
DEGREE_UNIT               = 60
SHOW_RENDER_IMG_DIALOG    = True
SAVE_FILE_PREFIX          = 'frame_'
SAVE_FILE_ZERO_FILL_DIGIT = 3
SAVE_FILE_TYPE            = c4d.FILTER_JPG

def main():

    doc             = c4d.documents.GetActiveDocument()
    rdata           = doc.GetActiveRenderData()
    base_draw       = doc.GetActiveBaseDraw()
    img_save_dir    = ''

    # console clear
    c4d.CallCommand(13957)

    if SAVE_FILE_TYPE == c4d.FILTER_JPG:
        pass
    elif SAVE_FILE_TYPE == c4d.FILTER_PNG:
        pass
    else:
        c4d.gui.MessageDialog('save file type not supported')
        return

    main_target_cam = doc.SearchObject('main_target_camera')
    
    if not main_target_cam:
        c4d.gui.MessageDialog('"main_target_camera" not found. please create one')
        return

    base_draw.SetSceneCamera(main_target_cam)

    if not img_save_dir:
        img_save_dir = storage.LoadDialog(c4d.FILESELECTTYPE_ANYTHING, 'Select Image Save Folder', c4d.FILESELECT_DIRECTORY, '', c4d.DOCUMENT_FILEPATH)
        if not img_save_dir:
            print 'image save directory select canceled'
            return
    
    if not os.path.isdir(img_save_dir):
        print 'image save directory not exists'
        return

    rd   = rdata.GetData()
    xres = int(round(rd[c4d.RDATA_XRES]))
    yres = int(round(rd[c4d.RDATA_YRES]))
    
    init_mat = main_target_cam.GetMg()

    # print 'init matrix : ' + format(init_mat)

    print '[render start]'
    
    degree = DEGREE_MIN
    while degree < DEGREE_MAX:

        cur_time = time.clock()

        if degree == DEGREE_MIN:
            h_degree = 0
        else:
            h_degree = DEGREE_UNIT

        m       = main_target_cam.GetMg()
        hpb     = c4d.Vector(utils.Rad(h_degree), utils.Rad(0), utils.Rad(0))
        rot_mat = c4d.utils.HPBToMatrix(hpb)
        new_mat = m.__rmul__(rot_mat)
        
        main_target_cam.SetMg(new_mat)
        
        c4d.EventAdd()
        
        bmp = bitmaps.BaseBitmap()
        bmp.Init(xres, yres, depth = 32)

        res = documents.RenderDocument(doc, rd, bmp, c4d.RENDERFLAGS_EXTERNAL)

        if res == c4d.RENDERRESULT_OK:
            if SAVE_FILE_TYPE == c4d.FILTER_JPG:
                filename = os.path.join(img_save_dir, SAVE_FILE_PREFIX + str(degree).zfill(SAVE_FILE_ZERO_FILL_DIGIT) + '.jpg')
                ret      = bmp.Save(filename, c4d.FILTER_JPG, rd, c4d.SAVEBIT_0)
            elif SAVE_FILE_TYPE == c4d.FILTER_PNG:
                bmp.AddChannel(1,0)
                filename = os.path.join(img_save_dir, SAVE_FILE_PREFIX + str(degree).zfill(SAVE_FILE_ZERO_FILL_DIGIT) + '.png')
                ret      = bmp.Save(filename, c4d.FILTER_PNG, rd, c4d.SAVEBIT_ALPHA)
            else:
                c4d.gui.MessageDialog('save file type not supported')
                return

            if ret == c4d.IMAGERESULT_OK:
                if SHOW_RENDER_IMG_DIALOG:
                    bitmaps.ShowBitmap(bmp)

                print filename + ' export success !'
            else:
                print filename + ' export failed !'
                break
        else:
            print 'export error : ' + str(res)
            return
        
        spend_time = time.clock() - cur_time

        print '> spend time : ' + str(spend_time)

        degree += DEGREE_UNIT
    
    main_target_cam.SetMg(init_mat)

    print '[render end]'

    # Save Folder Open
    subprocess.call(["open", "-R", filename])
    
if __name__=='__main__':
    main()
