import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { GiangVienService } from './giang-vien.service';
import { GiangVien } from './schemas/giang-vien.schema';

describe('GiangVienService', () => {
  let service: GiangVienService;
  let modelMock: {
    find: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    exists: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    modelMock = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiangVienService,
        {
          provide: getModelToken(GiangVien.name),
          useValue: modelMock,
        },
      ],
    }).compile();

    service = module.get<GiangVienService>(GiangVienService);
  });

  it('should create a lecturer with strictly the 4 allowed fields', async () => {
    modelMock.exists.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const createdObj = {
      _id: new Types.ObjectId().toString(),
      IDGV: 'GV001',
      Fullname: 'Nguyễn Văn An',
      Image: 'https://example.com/a.jpg',
      SumClass: 4,
    };
    modelMock.create.mockResolvedValue({
      toObject: () => createdObj,
    });

    const result = await service.create({
      IDGV: ' GV001 ',
      Fullname: ' Nguyễn Văn An ',
      Image: ' https://example.com/a.jpg ',
      SumClass: 4,
    });

    expect(modelMock.create).toHaveBeenCalledWith({
      IDGV: 'GV001',
      Fullname: 'Nguyễn Văn An',
      Image: 'https://example.com/a.jpg',
      SumClass: 4,
    });
    expect(result).toEqual(createdObj);
  });

  it('should throw ConflictException when IDGV already exists', async () => {
    modelMock.exists.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: '123' }),
    });

    await expect(
      service.create({
        IDGV: 'GV001',
        Fullname: 'Test',
        Image: 'https://example.com/a.jpg',
        SumClass: 2,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw BadRequestException on invalid ObjectId', async () => {
    await expect(service.findOne('invalid-id')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException when lecturer does not exist', async () => {
    const validId = new Types.ObjectId().toString();
    modelMock.findById.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
    });

    await expect(service.findOne(validId)).rejects.toThrow(NotFoundException);
  });

  it('should compute accurate lecturer stats', async () => {
    const docs = [
      { IDGV: 'GV001', Fullname: 'A', Image: 'img1', SumClass: 4 },
      { IDGV: 'GV002', Fullname: 'B', Image: 'img2', SumClass: 6 },
    ];
    modelMock.find.mockReturnValue({
      select: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue(docs) }),
      }),
    });

    const stats = await service.getStats();
    expect(stats).toEqual({
      totalLecturers: 2,
      totalClasses: 10,
      avgClasses: 5,
      maxClasses: 6,
      topLecturer: docs[1],
    });
  });

  it('should export clean JSON without _id', async () => {
    const exported = [
      { IDGV: 'GV001', Fullname: 'A', Image: 'img1', SumClass: 4 },
    ];
    const selectMock = jest.fn().mockReturnValue({
      sort: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue(exported) }),
      }),
    });
    modelMock.find.mockReturnValue({ select: selectMock });

    const res = await service.exportCleanJson();
    expect(selectMock).toHaveBeenCalledWith({
      _id: 0,
      IDGV: 1,
      Fullname: 1,
      Image: 1,
      SumClass: 1,
    });
    expect(res).toEqual(exported);
  });
});
